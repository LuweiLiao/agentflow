import os, re, glob

replaced = 0
files_modified = 0

for filepath in glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True):
    if '__test' in filepath or 'node_modules' in filepath or '.bak' in filepath:
        continue
    
    with open(filepath, 'r') as f:
        original = f.read()
    
    content = original
    
    # Replace "Anthropic's official CLI for Claude" first
    content = content.replace("Anthropic's official CLI for Claude", 'an interactive AI coding assistant')
    
    # Process line by line
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        stripped = line.lstrip()
        # Skip import lines
        if stripped.startswith('import ') or stripped.startswith('from '):
            new_lines.append(line)
            continue
        # Skip @anthropic-ai package refs
        if '@anthropic-ai' in line:
            new_lines.append(line)
            continue
        # Skip api.anthropic.com domain refs
        if 'anthropic.com' in line:
            new_lines.append(line)
            continue
        
        # Replace Anthropic in string literals only (single/double quotes, template literals)
        if 'Anthropic' in line:
            # Replace in single-quoted strings
            def repl_sq(m):
                s = m.group(0)
                if 'anthropic.com' in s.lower() or 'x-api-key' in s:
                    return s
                return s.replace('Anthropic', 'AgentFlow')
            
            line = re.sub(r"'[^']*'", repl_sq, line)
            line = re.sub(r'"[^"]*"', repl_sq, line)
            line = re.sub(r'`[^`]*`', repl_sq, line)
        
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        files_modified += 1
        replaced += original.count('Anthropic') - content.count('Anthropic')

print('Files modified: %d' % files_modified)
print('Anthropic replacements: %d' % replaced)
