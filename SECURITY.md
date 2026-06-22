<!-- 中文提示 / Chinese note: 安全策略正文为英文。简要说明：发现漏洞请勿公开 Issue，
     请按下方的私密渠道报告。 -->

# Security Policy

## 🔒 Reporting a vulnerability

We take the security of AgentFlow seriously. If you believe you have found a security
vulnerability, **please do not open a public GitHub issue**.

Instead, report it privately using one of these channels:

1. **Preferred — GitHub Private Vulnerability Reporting.**
   Go to <https://github.com/LuweiLiao/agentflow/security/advisories/new> and click
   **"Report a vulnerability"**. This is encrypted and visible only to maintainers.
2. **Email.** Send details to the maintainer via the email listed on the GitHub
   profile, with the subject line starting `[SECURITY] AgentFlow`.

### What to include

To help us reproduce and fix the issue quickly, please include:

- A clear description of the vulnerability and its impact.
- The exact version or commit hash you tested against.
- Step-by-step reproduction instructions (proof-of-concept is ideal).
- The affected component (backend orchestrator, agent runtime, SSE stream, frontend, Docker, etc.).
- Any known mitigations or workarounds.

### Our response commitments

- We will **acknowledge your report within 72 hours**.
- We will provide an **initial assessment within 7 days**.
- We will work with you on a **coordinated disclosure** timeline, typically publishing
  a fix and a GitHub Security Advisory once a patched release is available.
- We will **credit you** in the advisory unless you prefer to remain anonymous.

Please **do not** exploit the vulnerability beyond what is necessary to demonstrate it,
and do not disclose it publicly until a fix has been released.

---

## 🛡️ Supported versions

AgentFlow is in active development. Only the latest release line receives security
fixes; older versions are not patched.

| Version | Supported          | Notes                                  |
| ------- | ------------------ | -------------------------------------- |
| `1.0.x` | ✅ Yes              | Current release line.                  |
| `< 1.0` | ❌ No               | Pre-release / development builds.      |
| `main`  | ⚠️ Best-effort      | Development branch; fixes land here first. |

---

## 🧱 Scope

In scope:

- Vulnerabilities that let an attacker run untrusted code, access another user's data,
  or crash the orchestrator / agent runtime.
- Authentication or authorization flaws in the backend HTTP / SSE server.
- Issues in the agent runtime that allow prompt-injection-driven **code execution**
  outside the intended Claude-Code sandbox.
- Secret leakage (e.g., API keys returned in error responses or logs).

Out of scope (please use a regular issue or discussion instead):

- Theoretical issues with no working proof-of-concept.
- "Brute force" or rate-limiting recommendations for the dev server (it is not intended
  to be internet-facing without a reverse proxy).
- Vulnerabilities in third-party LLM providers (ZAI, DeepSeek, OpenAI) — report those
  to the respective vendor.
- Issues that require already having local code execution on the host.

---

## 🧰 Hardening tips for self-hosters

- **Run behind a reverse proxy** (nginx, Caddy) with TLS — the built-in HTTP server is
  not hardened for direct internet exposure.
- **Set API keys via environment variables** (see `.env.example`); never commit `.env`.
- **Restrict the Claude-Code engine path** (`AGENTFLOW_CC_ENGINE_DIR`) when running in
  multi-tenant environments.
- **Keep the Docker memory limits** in `docker-compose.yml` (default 8 GB) appropriate
  to your host to avoid denial-of-service via runaway agents.

Thank you for helping keep AgentFlow and its users safe. 🙏
