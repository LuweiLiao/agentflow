<!-- 中文提示 / Chinese note: 本文档为英文（国际开源惯例）。关键术语附中文注释以便阅读。
     This document is in English (international open-source standard); key terms carry
     short Chinese annotations for bilingual accessibility. -->

# Contributing to AgentFlow

First off — **thanks for taking the time to contribute!** 🎉

AgentFlow is an open-source multi-agent workflow orchestration platform. Every issue
report, fix, doc improvement, or idea makes it better. This guide explains how to set
up your environment, follow our conventions, and land a change.

> 📌 **TL;DR**: Fork → branch → `ruff` + `pytest` → conventional commit → open a PR.

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Ways to contribute](#-ways-to-contribute)
- [Development setup](#-development-setup)
- [Project structure](#-project-structure)
- [Code style](#-code-style)
- [Commit messages](#-commit-messages)
- [Pull request process](#-pull-request-process)
- [Issues and feature requests](#-issues-and-feature-requests)
- [Release process](#-release-process)
- [Getting help](#-getting-help)

---

## 🤝 Code of Conduct

Participation in this project is governed by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating you are expected to uphold this code. Please report unacceptable behavior to
**luweiliao@github** (open a private security advisory or DM a maintainer).

---

## ✨ Ways to contribute

You don't have to write code to help. Some ideas:

- 🐛 **Report bugs** — use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).
- ✨ **Suggest features** — use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).
- 📖 **Improve docs** — README typos, clearer examples, translation fixes all count.
- 🧪 **Add tests** — especially around the orchestrator and agent runtime edge cases.
- 🔌 **Add examples** — drop a workflow into [`examples/`](examples/) that shows a real use case.
- 💬 **Help others** — answer questions in [GitHub Discussions](https://github.com/LuweiLiao/agentflow/discussions).

---

## 🛠️ Development setup

### Prerequisites

| Tool      | Version   | Notes                                                              |
| --------- | --------- | ------------------------------------------------------------------ |
| Python    | ≥ 3.10    | Backend is **stdlib-only** — no `pip install` of runtime deps.    |
| Node.js   | ≥ 20      | For the frontend (Vite + React 19).                                |
| Bun       | optional  | Required only if you use the Claude-Code engine adapter.           |
| Git       | ≥ 2.30    |                                                                    |

### 1. Fork & clone

```bash
# Fork https://github.com/LuweiLiao/agentflow on GitHub first, then:
git clone https://github.com/<your-username>/agentflow.git
cd agentflow
git remote add upstream https://github.com/LuweiLiao/agentflow.git
```

### 2. Backend — Python (zero runtime dependencies)

```bash
# Optional: create a venv
python3 -m venv .venv && source .venv/bin/activate

# Dev tooling only (ruff, pytest, mypy, pre-commit)
pip install -e ".[dev]"

# Configure API keys (copy the example and fill in at least one)
cp .env.example .env

# Run the backend (default: http://0.0.0.0:9600)
python agentflow-backend.py
```

### 3. Frontend — TypeScript (Vite + React)

```bash
cd frontend
npm install        # or pnpm install / bun install
npm run dev        # http://127.0.0.1:5173  (proxies API calls to :9600)
```

In another terminal, keep the backend running (`python agentflow-backend.py`)
so the dev server can talk to it.

### 4. (Optional) Run everything via Docker

```bash
docker compose up --build      # serves http://localhost:9600
```

### 5. Verify your setup

```bash
pytest                 # backend tests
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

If all of the above pass, you're ready to hack. 🚀

---

## 🗂️ Project structure

```
agentflow/
├── agentflow-backend.py     # FastAPI-less HTTP server + SSE stream (stdlib)
├── agent_runner.py          # Multi-provider agent runtime (ZAI/DeepSeek/OpenAI/CC)
├── claude_code_adapter.py   # Adapter to the Claude-Code execution engine
├── agentflow_schema.py      # DAG / artifact / task data contracts (Pydantic-free)
├── artifact_broker.py       # Inter-agent artifact passing & DAG scheduling
├── evolution_engine.py      # Self-improvement loop (control-system metaphor)
├── frontend/                # React 19 + Vite + @xyflow/react canvas UI
│   └── src/
├── examples/                # Reference workflows
├── evals/                   # Evaluation harness inputs
├── tests/                   # pytest test suite
├── docs/                    # Design docs and architecture notes
├── .github/                 # Issue templates, PR template, CI workflows
├── docker-compose.yml       # One-command deploy
└── pyproject.toml           # Project metadata + dev tooling config
```

> The architecture is described in detail in
> [`01-vision-and-philosophy/`](01-vision-and-philosophy/) through
> [`08-implementation-roadmap/`](08-implementation-roadmap/).

---

## 🎨 Code style

### Python (backend)

- **Standard library only.** Do **not** add third-party runtime dependencies.
  If a feature truly needs one, open a discussion first — the zero-dependency
  guarantee is a core project value.
- Enforced by **[ruff](https://docs.astral.sh/ruff/)** with these settings
  (already in `pyproject.toml`):
  ```toml
  [tool.ruff]
  line-length = 120
  target-version = "py310"
  [tool.ruff.lint]
  select = ["E", "F", "I", "N", "W"]
  ```
- Type hints are encouraged. `mypy --strict` is a goal, not yet enforced.
- Functions and public classes get **docstrings** (PEP 257). One short
  sentence for simple functions; more for non-obvious logic.

```bash
ruff check .          # lint
ruff format .         # auto-format
mypy .                # type-check (best-effort)
```

### TypeScript (frontend)

- `tsconfig.json` enables **strict mode**. Avoid `any`; prefer `unknown` + narrowing.
- Use **functional React** + hooks. No class components.
- Prefer **named exports**. One component per file.
- Formatting follows the repo's ESLint/Vite defaults; run `npm run typecheck`
  and `npm run build` before pushing.

### General

- Keep functions small and focused. If it has more than ~3 levels of nesting,
  extract a helper.
- Prefer explicit over clever. The codebase is read more often than it's written.
- Delete dead code. Don't leave commented-out blocks behind.
- Public API or schema changes must update `agentflow_schema.py` and any related docs.

---

## 📝 Commit messages

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.
This keeps history readable and powers automated changelog generation.

```
<type>(<optional scope>): <short imperative summary>

<optional body — what and why>

<optional footer(s)>
```

### Allowed types

| Type       | Use for                                                            |
| ---------- | ----------------------------------------------------------------- |
| `feat`     | A new user-facing feature                                         |
| `fix`      | A bug fix                                                         |
| `docs`     | Documentation only                                                |
| `refactor` | Code change that neither fixes a bug nor adds a feature           |
| `perf`     | Performance improvement                                           |
| `test`     | Adding or correcting tests                                        |
| `build`    | Build system, dependencies, Docker                                |
| `ci`       | CI configuration                                                  |
| `chore`    | Misc. repo maintenance (not user-facing)                          |
| `revert`   | Reverting a previous commit                                       |

### Examples

```text
feat(orchestrator): support conditional branches in the DAG

Adds an `if` node type that short-circuits its downstream layer when
the upstream artifact matches a predicate. Closes #142.

fix(sse): flush chunks immediately under WSGI buffering

docs(readme): clarify the zero-dependency guarantee

test(agent_runner): cover ZAI 429 retry path
```

### Tips

- Keep the summary **≤ 72 characters**, imperative mood ("add", not "added").
- Reference issues in the footer (`Closes #123`, `Refs #456`).
- For breaking changes, add a `BREAKING CHANGE:` footer and bump the major version in the PR description.
- We **do not** squash on merge by default — keep your commits meaningful.

---

## 🔄 Pull request process

1. **Branch from `main`.** Use a descriptive name:
   `feat/dag-conditional`, `fix/sse-flush`, `docs/contributing`.
2. **Make focused commits.** One logical change per commit.
3. **Write tests.** New behavior should come with tests. Bug fixes should
   include a regression test.
4. **Run all checks locally:**
   ```bash
   ruff check . && ruff format --check .
   pytest -q
   npm --prefix frontend run typecheck
   npm --prefix frontend run build
   ```
5. **Open the PR** against `main` using the
   [PR template](.github/PULL_REQUEST_TEMPLATE.md). Fill in every section.
6. **CI must be green.** If a check fails, push a fix-up commit (don't force-push
   unless asked).
7. **Address review feedback** with new commits on the same branch.
8. A **maintainer** will approve and merge once CI passes and at least one review
   is in.

### What reviewers look for

- ✅ Matches the issue / problem statement.
- ✅ Doesn't break the stdlib-only rule for backend.
- ✅ Includes tests and the tests actually exercise the new behavior.
- ✅ Public API or schema changes are documented.
- ✅ No secrets, API keys, or `.env` files committed.

---

## 🧩 Issues and feature requests

- **Bugs** → [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Features** → [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Questions & ideas** → [GitHub Discussions](https://github.com/LuweiLiao/agentflow/discussions).
- Blank issues are disabled so that every report carries enough context to act on.

Please **search first** before opening a new issue — duplicates waste everyone's time.

---

## 🚀 Release process

Maintainers handle releases. In short:

1. CI is green on `main`.
2. Bump version in `pyproject.toml` (backend) and `frontend/package.json` (frontend).
3. Tag with `vX.Y.Z` (e.g. `v1.2.0`) and push the tag.
4. GitHub Actions builds the release artifacts and Docker image.
5. Release notes are drafted from the Conventional Commit history.

---

## 🆘 Getting help

- 💬 [GitHub Discussions](https://github.com/LuweiLiao/agentflow/discussions) — best for "how do I…" questions.
- 🐛 [Issues](https://github.com/LuweiLiao/agentflow/issues) — only for confirmed bugs or agreed features.
- 📖 Start with the `README.md` and the `0X-*` design docs.

Happy hacking! 🌊
