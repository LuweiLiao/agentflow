#!/usr/bin/env python3
"""
Iteratively fix "No matching export" and "Could not resolve" build errors
produced by `bun run build.ts`.

Strategy:
1. Run the build, capture stderr+stdout
2. Parse errors of two kinds:
   - "No matching export in \"<relpath>\" for import \"<NAME>\""
   - "Could not resolve \"<specifier>\"" at <absfile>:line:col
3. For "No matching export":
   - Inspect the importer line to decide if it's a `type` import or value.
   - Append a stub export to the target file.
4. For "Could not resolve":
   - Try to resolve the specifier relative to the importing file.
   - Create a stub .ts/.tsx module exporting an `undefined` default and/or a
     catch-all proxy for the named imports found in the importer line.
5. Repeat until the build succeeds or no more fixable errors appear.
"""

import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
MAX_ITERS = 200

# Regexes for parsing Bun error output.
# Example line:
#   error: No matching export in "src/services/remoteManagedSettings/syncCacheState.ts" for import "getRemoteManagedSettingsSyncFromCache"
RE_NO_EXPORT = re.compile(
    r'No matching export in "([^"]+)" for import "([^"]+)"'
)

# Example line:
#   error: Could not resolve "./foo"
# followed by an "at /abs/path/file.ts:LINE:COL"
RE_COULD_NOT_RESOLVE = re.compile(
    r'Could not resolve "([^"]+)"'
)
RE_AT_LOCATION = re.compile(
    r'^\s*at\s+([^:]+):(\d+):(\d+)'
)


def run_build():
    """Run `bun run build.ts` and return (success, output_text)."""
    proc = subprocess.run(
        ["bun", "run", "build.ts"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode == 0, out


def is_type_import(importer_path: str, name: str) -> bool:
    """Inspect the importer file to see if `name` is imported as a type."""
    try:
        with open(importer_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    except OSError:
        return False

    # Look for `import type { ... NAME ... }` or `import { type NAME, ... }`
    # Search for any line that mentions NAME inside an import block.
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if "import" not in line:
            continue
        # crude block scan: combine multi-line imports
        block_start = i
        block_end = i
        depth = line.count("{") - line.count("}")
        j = i
        while depth > 0 and j + 1 < len(lines):
            j += 1
            block_end = j
            depth += lines[j].count("{") - lines[j].count("}")
        block = "\n".join(lines[block_start:block_end + 1])
        # If NAME is not in this block, skip.
        if name not in block:
            continue
        # If the whole statement is `import type { ... }`, it's a type.
        if re.search(r"import\s+type\b", block):
            return True
        # Inline type modifier `import { type NAME`
        if re.search(r"\btype\s+" + re.escape(name) + r"\b", block):
            return True
        return False
    return False


def already_exported(target_path: str, name: str) -> bool:
    """Check if `name` is already exported from the target file."""
    try:
        with open(target_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    except OSError:
        return False
    # Look for any `export ... NAME` pattern
    pattern = re.compile(
        r"export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+"
        + re.escape(name)
        + r"\b"
    )
    if pattern.search(text):
        return True
    # Also re-export: `export { NAME }` or `export { NAME,`
    pattern2 = re.compile(r"export\s*\{[^}]*\b" + re.escape(name) + r"\b[^}]*\}")
    return bool(pattern2.search(text))


def append_value_export(target_path: str, name: str):
    """Append a value stub export. Choose function or const based on naming."""
    # If name starts with uppercase → could be class/const; otherwise function.
    # Use a function stub for everything — most flexible for value imports.
    stub = (
        f"\n/** Auto-generated stub export. */\n"
        f"export function {name}(..._args: any[]): any {{ return undefined }}\n"
    )
    with open(target_path, "a", encoding="utf-8") as f:
        f.write(stub)
    print(f"  + appended value export `{name}` to {os.path.relpath(target_path, ROOT)}")


def append_type_export(target_path: str, name: str):
    """Append a type stub export."""
    stub = f"\n/** Auto-generated type stub. */\nexport type {name} = any\n"
    with open(target_path, "a", encoding="utf-8") as f:
        f.write(stub)
    print(f"  + appended type export `{name}` to {os.path.relpath(target_path, ROOT)}")


def fix_no_export(rel_path: str, name: str, importer_path: str) -> bool:
    """Add a missing export to the target file. Returns True if changed."""
    # Resolve target path relative to repo root.
    target_path = os.path.join(ROOT, rel_path) if not os.path.isabs(rel_path) else rel_path
    if not os.path.exists(target_path):
        # Try resolving under src/ as a fallback
        candidate = os.path.join(ROOT, "src", rel_path.replace("src/", "", 1) if rel_path.startswith("src/") else rel_path)
        if os.path.exists(candidate):
            target_path = candidate
        else:
            print(f"  ! target file not found: {rel_path}")
            return False

    if already_exported(target_path, name):
        print(f"  = {name} already exported in {os.path.relpath(target_path, ROOT)}")
        return False

    if is_type_import(importer_path, name):
        append_type_export(target_path, name)
    else:
        append_value_export(target_path, name)
    return True


def find_named_imports(importer_path: str, line_no: int) -> list:
    """Return list of named imports on the given line (best effort)."""
    try:
        with open(importer_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except OSError:
        return []
    # Gather a multi-line block starting near line_no (1-indexed)
    start = max(0, line_no - 1)
    block_lines = []
    depth = 0
    started = False
    j = start
    while j < len(lines):
        line = lines[j]
        block_lines.append(line)
        depth += line.count("{") - line.count("}")
        if "{" in line:
            started = True
        if started and depth <= 0:
            break
        j += 1
        if j - start > 20:
            break
    block = "".join(block_lines)
    # Extract names inside { ... }
    m = re.search(r"\{([^}]*)\}", block)
    if not m:
        return []
    names = []
    for part in m.group(1).split(","):
        part = part.strip()
        if not part:
            continue
        # remove `type ` prefix and `as alias`
        part = re.sub(r"^\s*type\s+", "", part)
        part = part.split(" as ")[0].strip()
        if part:
            names.append(part)
    return names


def resolve_specifier(specifier: str, importer_path: str):
    """Resolve a relative specifier against the importing file."""
    if not specifier.startswith("."):
        return None  # only handle relative
    base = os.path.dirname(importer_path)
    candidate = os.path.normpath(os.path.join(base, specifier))
    # Try as-is, then with extensions
    candidates = [candidate]
    for ext in (".ts", ".tsx", ".js", ".jsx", ".json", "/index.ts", "/index.tsx", "/index.js"):
        candidates.append(candidate + ext)
    for c in candidates:
        if os.path.exists(c) and os.path.isfile(c):
            return c
    # Pick the first non-existing candidate with .ts extension to create
    if candidate.endswith(".js"):
        candidate = candidate[:-3] + ".ts"
    elif not os.path.splitext(candidate)[1]:
        candidate = candidate + ".ts"
    return candidate


def fix_could_not_resolve(specifier: str, importer_path: str, line_no: int) -> bool:
    """Create a stub file for an unresolvable specifier. Returns True if created."""
    target = resolve_specifier(specifier, importer_path)
    if target is None:
        print(f"  ! cannot resolve non-relative specifier: {specifier} (from {os.path.relpath(importer_path, ROOT)})")
        return False
    if os.path.exists(target):
        print(f"  = file already exists: {os.path.relpath(target, ROOT)}")
        return False

    os.makedirs(os.path.dirname(target), exist_ok=True)
    names = find_named_imports(importer_path, line_no)
    body = "/** Auto-generated stub module. */\n"
    if names:
        for n in names:
            # first letter uppercase → treat as type/const, else function
            if n[:1].isupper():
                body += f"export const {n}: any = undefined\n"
            else:
                body += f"export function {n}(..._args: any[]): any {{ return undefined }}\n"
    body += "export default undefined\n"
    with open(target, "w", encoding="utf-8") as f:
        f.write(body)
    print(f"  + created stub module: {os.path.relpath(target, ROOT)}")
    return True


def parse_errors(output: str):
    """Parse build output and return lists of fixes to apply."""
    no_export_fixes = []  # list of (rel_path, name, importer_abs)
    resolve_fixes = []    # list of (specifier, importer_abs, line_no)

    lines = output.splitlines()
    # First pass: collect "at" locations preceding each error line.
    for i, line in enumerate(lines):
        m = RE_NO_EXPORT.search(line)
        if m:
            rel_path, name = m.group(1), m.group(2)
            # Find the "at" line within the next ~5 lines to identify importer.
            importer_abs = None
            for k in range(i + 1, min(i + 6, len(lines))):
                am = RE_AT_LOCATION.match(lines[k])
                if am:
                    importer_abs = am.group(1)
                    break
            no_export_fixes.append((rel_path, name, importer_abs))
            continue

        m = RE_COULD_NOT_RESOLVE.search(line)
        if m:
            specifier = m.group(1)
            # Could-not-resolve may produce false matches on lines that
            # are merely quoting the import; require an `at` location.
            importer_abs = None
            line_no = 0
            for k in range(i + 1, min(i + 6, len(lines))):
                am = RE_AT_LOCATION.match(lines[k])
                if am:
                    importer_abs = am.group(1)
                    line_no = int(am.group(2))
                    break
            if importer_abs:
                resolve_fixes.append((specifier, importer_abs, line_no))

    return no_export_fixes, resolve_fixes


def main():
    print(f"Working directory: {ROOT}")
    for it in range(1, MAX_ITERS + 1):
        print(f"\n========== Iteration {it}/{MAX_ITERS} ==========")
        ok, output = run_build()
        if ok:
            print("✓ BUILD SUCCEEDED")
            # Sanity check dist
            dist_cli = os.path.join(ROOT, "dist", "cli-bun.js")
            if os.path.exists(dist_cli):
                print(f"✓ dist/cli-bun.js exists")
            else:
                # list what's in dist
                d = os.path.join(ROOT, "dist")
                if os.path.isdir(d):
                    print(f"  dist contents: {sorted(os.listdir(d))[:10]}")
            return 0

        # Print a compact error summary
        err_lines = [l for l in output.splitlines() if l.strip().startswith("error:") or "No matching export" in l or "Could not resolve" in l]
        print(f"Build failed. {len(err_lines)} error line(s). First few:")
        for l in err_lines[:8]:
            print(f"  {l}")

        no_export_fixes, resolve_fixes = parse_errors(output)
        print(f"Parsed: {len(no_export_fixes)} missing-export fixes, {len(resolve_fixes)} resolve fixes")

        changed = False
        for rel_path, name, importer_abs in no_export_fixes:
            if importer_abs is None:
                # Fall back to scanning the output for the file path
                print(f"  ! no importer location for `{name}` in {rel_path}; skipping")
                continue
            if fix_no_export(rel_path, name, importer_abs):
                changed = True

        for specifier, importer_abs, line_no in resolve_fixes:
            if fix_could_not_resolve(specifier, importer_abs, line_no):
                changed = True

        if not changed:
            print("No more fixable errors — stopping.")
            # Dump last bit of output for diagnostics
            print("\n--- last 30 lines of build output ---")
            print("\n".join(output.splitlines()[-30:]))
            return 1

    print(f"\nReached max iterations ({MAX_ITERS}) without success.")
    print("\n--- last 40 lines of build output ---")
    print("\n".join(output.splitlines()[-40:]))
    return 1


if __name__ == "__main__":
    sys.exit(main())
