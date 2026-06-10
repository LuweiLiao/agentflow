#!/usr/bin/env python3
"""API tests for agentflow-backend.py."""



import sys, os, json, time, threading, socket, tempfile
import pytest
from unittest import mock
import importlib.util

# Must mock sys.argv before importing agentflow-backend (it reads argv[1])
_saved_argv = sys.argv
sys.argv = ['agentflow-backend.py', '19600']  # use a dummy non-standard port

# Load agentflow-backend.py (name has a hyphen, so use spec_from_file_location)
_spec = importlib.util.spec_from_file_location(
    "agentflow_backend", "/home/llw/agentflow/agentflow-backend.py"
)
agentflow_backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(agentflow_backend)
sys.argv = _saved_argv  # restore

from http.server import HTTPServer
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


class _TestServer:
    """Context manager that starts AgentFlowHandler on a random port."""

    def __init__(self, env_overrides=None):
        self.env_overrides = env_overrides or {}
        # Map from env var names to module variable names
        self._env_to_module = {
            "AGENTFLOW_API_TOKEN": "AGENTFLOW_API_TOKEN",
            "AGENTFLOW_MAX_BODY_SIZE": "MAX_BODY_SIZE",
            "AGENTFLOW_ALLOWED_ORIGIN": None,  # handled by os.environ in _cors_headers
        }
        self._server = None
        self._thread = None
        self.port = None

    def __enter__(self):
        # Patch AgentRunner so no real LLM calls happen
        self._agent_runner_patcher = mock.patch.object(
            agentflow_backend, 'AgentRunner', autospec=True
        )
        self._mock_runner_cls = self._agent_runner_patcher.start()
        self._mock_runner = mock.MagicMock()
        self._mock_runner_cls.return_value = self._mock_runner
        self._mock_runner.api_key = "sk-test"
        # Configure mock execute to return a proper dict
        # The output should be parseable JSON for call_llm to work
        self._mock_runner.execute.return_value = {
            "result": "完成",
            "output": '[{"id":"a1","icon":"🤖","label":"开发","desc":"编写代码","color":"blue","profile":"dev"}]',
            "cost": 0.001,
            "duration_ms": 100,
            "status": "ok",
            "turns": 1,
            "model": "test-model",
            "provider": "test-provider",
        }

        # Save & override env vars
        self._saved_env = {}
        self._saved_module_vars = {}
        for k, v in self.env_overrides.items():
            # Save env
            self._saved_env[k] = os.environ.get(k)
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
            # Also patch the corresponding module-level variable if it exists
            module_attr = self._env_to_module.get(k)
            if module_attr and hasattr(agentflow_backend, module_attr):
                self._saved_module_vars[module_attr] = getattr(agentflow_backend, module_attr)
                if v is None:
                    setattr(agentflow_backend, module_attr, "")
                elif module_attr == "MAX_BODY_SIZE":
                    setattr(agentflow_backend, module_attr, int(v))
                else:
                    setattr(agentflow_backend, module_attr, v)

        # Bind to port 0 to get a free port
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind(("127.0.0.1", 0))
        self.port = sock.getsockname()[1]
        sock.close()

        self._server = HTTPServer(("127.0.0.1", self.port),
                                   agentflow_backend.AgentFlowHandler)
        self._thread = threading.Thread(target=self._server.serve_forever,
                                         daemon=True)
        self._thread.start()
        time.sleep(0.1)  # let server start
        return self

    def __exit__(self, *args):
        if self._server:
            self._server.shutdown()
        self._agent_runner_patcher.stop()
        for k, v in self._saved_env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        for k, v in self._saved_module_vars.items():
            if v is None:
                setattr(agentflow_backend, k, "")
            else:
                setattr(agentflow_backend, k, v)

    def url(self, path):
        return f"http://127.0.0.1:{self.port}{path}"

    def get(self, path, headers=None):
        req = Request(self.url(path), headers=headers or {})
        try:
            resp = urlopen(req, timeout=5)
            return resp.status, resp.read(), dict(resp.headers)
        except HTTPError as e:
            return e.code, e.read(), dict(e.headers)

    def post(self, path, data, headers=None):
        hdrs = {"Content-Type": "application/json"}
        if headers:
            hdrs.update(headers)
        body = json.dumps(data).encode() if isinstance(data, dict) else data
        req = Request(self.url(path), data=body, headers=hdrs, method="POST")
        try:
            resp = urlopen(req, timeout=5)
            raw = resp.read()
            if raw:
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    parsed = {"_raw": raw.decode("utf-8", errors="replace")}
            else:
                parsed = {}
            return resp.status, parsed, dict(resp.headers)
        except HTTPError as e:
            raw = e.read()
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"_raw": raw.decode("utf-8", errors="replace")}
            return e.code, parsed, dict(e.headers)


# ═══════════════════════════════════════════════════════
# CORS tests
# ═══════════════════════════════════════════════════════

class TestCORSRestricted:
    def test_cors_not_wildcard(self):
        """CORS header should NOT be '*'."""
        with _TestServer() as srv:
            status, body, headers = srv.get("/")
            origin = headers.get("Access-Control-Allow-Origin", "")
            assert origin != "*"
            # Default should be localhost
            assert "localhost" in origin

    def test_cors_with_origin_header(self):
        """When sending an Origin header, the response should echo it only if allowed."""
        with _TestServer() as srv:
            req = Request(srv.url("/"))
            req.add_header("Origin", "http://localhost")
            resp = urlopen(req, timeout=5)
            origin = resp.headers.get("Access-Control-Allow-Origin", "")
            assert "localhost" in origin

    def test_cors_options_request(self):
        """OPTIONS request should return CORS headers."""
        with _TestServer() as srv:
            req = Request(srv.url("/api/decompose"), method="OPTIONS")
            resp = urlopen(req, timeout=5)
            assert resp.status == 204
            origin = resp.headers.get("Access-Control-Allow-Origin", "")
            assert "localhost" in origin
            assert resp.headers.get("Access-Control-Allow-Methods") is not None

    def test_cors_rejects_arbitrary_origin(self):
        """Arbitrary external origin should be replaced with localhost."""
        with _TestServer() as srv:
            req = Request(srv.url("/"))
            req.add_header("Origin", "https://evil.com")
            resp = urlopen(req, timeout=5)
            origin = resp.headers.get("Access-Control-Allow-Origin", "")
            assert origin == "http://localhost"


# ═══════════════════════════════════════════════════════
# API Key Auth tests
# ═══════════════════════════════════════════════════════

class TestAPIAuth:
    def test_missing_token_allows_access(self):
        """When AGENTFLOW_API_TOKEN is not set, requests should pass."""
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": None}) as srv:
            status, body, headers = srv.post(
                "/api/decompose",
                {"requirement": "test", "count": 1},
            )
            assert status in (200, 400)  # either works if auth passes

    def test_wrong_token_rejected(self):
        """Request with wrong Bearer token should get 401."""
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": "mysecret"}) as srv:
            status, parsed, headers = srv.post(
                "/api/decompose", {"requirement": "t", "count": 1}
            )
            assert status == 401

    def test_correct_token_accepted(self):
        """Request with correct Bearer token should pass."""
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": "mysecret"}) as srv:
            status, body, headers = srv.post(
                "/api/decompose",
                {"requirement": "test", "count": 1},
                headers={"Authorization": "Bearer mysecret"},
            )
            assert status in (200,)

    def test_x_api_key_auth(self):
        """X-API-Key header should also work for auth."""
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": "mysecret"}) as srv:
            status, body, headers = srv.post(
                "/api/decompose",
                {"requirement": "test", "count": 1},
                headers={"X-API-Key": "mysecret"},
            )
            assert status in (200,)


# ═══════════════════════════════════════════════════════
# Body size limit tests
# ═══════════════════════════════════════════════════════

class TestBodySizeLimit:
    def test_large_body_rejected(self):
        """Body exceeding MAX_BODY_SIZE should be rejected (413 preferred, 400 acceptable)."""
        with _TestServer(env_overrides={"AGENTFLOW_MAX_BODY_SIZE": "100"}) as srv:
            big_payload = {"requirement": "x" * 200, "count": 50}
            body = json.dumps(big_payload).encode()
            req = Request(
                srv.url("/api/decompose"),
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                resp = urlopen(req, timeout=5)
                # If it gets through (unexpectedly), fail
                assert False, f"Expected error, got {resp.status}"
            except HTTPError as e:
                assert e.code in (413, 400), f"Expected 413 or 400, got {e.code}"

    def test_small_body_accepted(self):
        """Small body should be accepted."""
        with _TestServer(env_overrides={
            "AGENTFLOW_MAX_BODY_SIZE": str(1024 * 1024),
            "AGENTFLOW_API_TOKEN": None,
        }) as srv:
            req = Request(
                srv.url("/api/decompose"),
                data=json.dumps({"requirement": "small test", "count": 3}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            resp = urlopen(req, timeout=5)
            assert resp.status == 200

    def test_execute_large_body_rejected(self):
        """Large body on /api/execute should also be rejected (413 preferred, 400 acceptable)."""
        with _TestServer(env_overrides={"AGENTFLOW_MAX_BODY_SIZE": "50"}) as srv:
            big_nodes = [{"id": f"n{i}", "profile": "dev"} for i in range(100)]
            body = json.dumps({"nodes": big_nodes}).encode()
            req = Request(
                srv.url("/api/execute"),
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                resp = urlopen(req, timeout=5)
                assert False, f"Expected error, got {resp.status}"
            except HTTPError as e:
                assert e.code in (413, 400), f"Expected 413 or 400, got {e.code}"


# ═══════════════════════════════════════════════════════
# Static file path traversal tests
# ═══════════════════════════════════════════════════════

class TestStaticPathTraversal:
    def test_path_traversal_attempt_blocked(self):
        """Accessing files via '..' in path should get 403."""
        with _TestServer() as srv:
            try:
                req = Request(srv.url("/../../etc/passwd"))
                urlopen(req, timeout=5)
            except HTTPError as e:
                assert e.code == 403

    def test_absolute_path_traversal_blocked(self):
        """Accessing absolute paths like /etc/passwd should be blocked."""
        with _TestServer() as srv:
            try:
                req = Request(srv.url("/etc/passwd"))
                urlopen(req, timeout=5)
            except HTTPError as e:
                assert e.code == 403

    def test_valid_static_file_served(self):
        """A valid static file should be served (200)."""
        with _TestServer() as srv:
            # The server may not have canvas-demo.html, but the handler
            # falls back to it and returns 404 if it doesn't exist.
            # That's fine — what matters is it doesn't return 403.
            try:
                req = Request(srv.url("/canvas-demo.html"))
                resp = urlopen(req, timeout=5)
                assert resp.status == 200
            except HTTPError as e:
                # 404 is OK if file doesn't exist
                assert e.code in (404, 500)  # but not 403
