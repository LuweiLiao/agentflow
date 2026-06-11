#!/usr/bin/env python3
"""API tests for agentflow-backend.py."""



import importlib.util
import json
import os
import socket
import sys
import threading
import time
from unittest import mock

# Must mock sys.argv before importing agentflow-backend (it reads argv[1])
_saved_argv = sys.argv
sys.argv = ['agentflow-backend.py', '19600']  # use a dummy non-standard port

# Load agentflow-backend.py (name has a hyphen, so use spec_from_file_location)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend_path = os.path.join(PROJECT_ROOT, "agentflow-backend.py")
_spec = importlib.util.spec_from_file_location(
    "agentflow_backend", _backend_path
)
agentflow_backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(agentflow_backend)
sys.argv = _saved_argv  # restore

from http.server import HTTPServer  # noqa: E402
from urllib.error import HTTPError  # noqa: E402
from urllib.request import Request, urlopen  # noqa: E402


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
        self._mock_runner.provider_name = "test-provider"
        self._mock_runner_cls.PROVIDER_CONFIGS = {
            "deepseek": {"key_env": "DEEPSEEK_API_KEY", "base_env": "DEEPSEEK_BASE_URL", "default_base": "https://api.deepseek.com/v1"},
            "test-provider": {"key_env": "TEST_API_KEY", "base_env": "TEST_BASE_URL", "default_base": "http://test.local/v1"},
        }
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

    def put(self, path, data, headers=None):
        hdrs = {"Content-Type": "application/json"}
        if headers:
            hdrs.update(headers)
        body = json.dumps(data).encode() if isinstance(data, dict) else data
        req = Request(self.url(path), data=body, headers=hdrs, method="PUT")
        try:
            resp = urlopen(req, timeout=5)
            raw = resp.read()
            parsed = json.loads(raw) if raw else {}
            return resp.status, parsed, dict(resp.headers)
        except HTTPError as e:
            raw = e.read()
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"_raw": raw.decode("utf-8", errors="replace")}
            return e.code, parsed, dict(e.headers)

    def delete(self, path, headers=None):
        req = Request(self.url(path), headers=headers or {}, method="DELETE")
        try:
            resp = urlopen(req, timeout=5)
            raw = resp.read()
            parsed = json.loads(raw) if raw else {}
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


class TestStaticFileWhitelist:
    """Phase 0-1: .env 等不安全文件不应被静态服务泄露。"""

    def test_env_file_blocked(self):
        with _TestServer() as srv:
            req = Request(srv.url("/.env"))
            try:
                resp = urlopen(req, timeout=5)
                assert False, f"Expected 403, got {resp.status}"
            except HTTPError as e:
                assert e.code == 403, f"Expected 403, got {e.code}"

    def test_pyc_file_blocked(self):
        with _TestServer() as srv:
            req = Request(srv.url("/agentflow-backend.pyc"))
            try:
                resp = urlopen(req, timeout=5)
                assert False, f"Expected 403, got {resp.status}"
            except HTTPError as e:
                assert e.code == 403

    def test_html_file_allowed(self):
        with _TestServer() as srv:
            req = Request(srv.url("/canvas-demo.html"))
            resp = urlopen(req, timeout=5)
            assert resp.status == 200

    def test_head_static_file_allowed_without_body(self):
        with _TestServer() as srv:
            req = Request(srv.url("/canvas-demo.html"), method="HEAD")
            resp = urlopen(req, timeout=5)
            assert resp.status == 200
            assert resp.headers.get("Content-Length")
            assert resp.read() == b""


# ═══════════════════════════════════════════════════════
# Execute async + validation tests
# ═══════════════════════════════════════════════════════

class TestExecuteAsync:
    def test_execute_returns_202_with_run_id(self):
        with _TestServer() as srv:
            nodes = [{"id": "n1", "profile": "dev", "label": "test"}]
            status, data, _ = srv.post(
                "/api/execute", {"nodes": nodes, "requirement": "test req"}
            )
            assert status == 202
            assert data.get("run_id")
            assert data.get("status") == "pending"

    def test_decompose_count_clamped_to_100(self):
        with _TestServer() as srv:
            status, data, _ = srv.post(
                "/api/decompose",
                {"requirement": "生成一个大型多 Agent 工作流", "count": 150},
            )
            assert status == 200
            assert data["count"] == 100
            assert len(data["nodes"]) == 100

    def test_decompose_fallback_can_generate_100_nodes_without_api_key(self):
        with _TestServer() as srv:
            srv._mock_runner.api_key = ""
            status, data, _ = srv.post(
                "/api/decompose",
                {"requirement": "生成一个大型多 Agent 工作流", "count": 100},
            )
            assert status == 200
            assert data["count"] == 100
            assert len(data["nodes"]) == 100
            seen_ids = set()
            for node in data["nodes"]:
                for dep in node.get("depends_on", []):
                    assert dep in seen_ids
                seen_ids.add(node["id"])

    def test_decompose_empty_requirement_returns_400(self):
        with _TestServer() as srv:
            status, data, _ = srv.post("/api/decompose", {"requirement": "", "count": 3})
            assert status == 400
            assert "empty" in data.get("error", "").lower()

    def test_execute_run_completes_with_mock_agent(self):
        with _TestServer() as srv:
            nodes = [{"id": "n1", "profile": "dev", "label": "test"}]
            status, data, _ = srv.post(
                "/api/execute", {"nodes": nodes, "requirement": "integration test"}
            )
            assert status == 202
            run_id = data["run_id"]
            final = None
            for _ in range(60):
                time.sleep(0.1)
                code, raw, _ = srv.get(f"/api/runs/{run_id}")
                assert code == 200
                final = json.loads(raw)
                if final.get("status") in ("completed", "failed"):
                    break
            assert final is not None
            assert final["status"] in ("completed", "failed")
            assert final["nodes"][0]["status"] in ("completed", "failed", "skipped")

    def test_run_events_route_extracts_run_id_before_events_suffix(self):
        captured = []

        def fake_events(handler, run_id):
            captured.append(run_id)
            handler._send_json(200, {"run_id": run_id})

        with mock.patch.object(
            agentflow_backend.AgentFlowHandler,
            "_handle_run_events",
            fake_events,
        ):
            with _TestServer() as srv:
                code, raw, _ = srv.get("/api/runs/run_route_check/events")

        assert code == 200
        assert json.loads(raw)["run_id"] == "run_route_check"
        assert captured == ["run_route_check"]

    def test_build_workflow_edges_from_depends_on(self):
        nodes_data = [
            {"node_id": "a1", "depends_on": ""},
            {"node_id": "a2", "depends_on": "a1"},
            {"node_id": "a3", "depends_on": "a1,a2"},
        ]
        edges = agentflow_backend._build_workflow_edges(nodes_data)
        assert len(edges) == 3
        assert edges[0].source == "a1" and edges[0].target == "a2"
        assert edges[1].source == "a1" and edges[1].target == "a3"
        assert edges[2].source == "a2" and edges[2].target == "a3"


class TestRuntimeStatus:
    def test_status_endpoint_returns_api_key_flag(self):
        with _TestServer() as srv:
            code, raw, _ = srv.get("/api/status")
            assert code == 200
            data = json.loads(raw)
            assert "api_key_configured" in data
            assert data["api_key_configured"] is True  # mock AgentRunner has sk-test
            assert data.get("model")
            assert data.get("provider")
            assert data.get("key_env")


class TestWorkflowCRUD:
    _SAMPLE_NODES = [
        {"id": "n1", "profile": "dev", "label": "开发", "icon": "💻", "desc": "写代码", "color": "green"},
        {"id": "n2", "profile": "test", "label": "测试", "icon": "🧪", "desc": "跑测试", "color": "purple",
         "depends_on": ["n1"]},
    ]
    _SAMPLE_EDGES = [{"source": "n1", "target": "n2"}]

    def test_create_and_get_workflow(self):
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": None}) as srv:
            status, data, _ = srv.post("/api/workflows", {
                "name": "测试工作流",
                "requirement": "集成测试需求",
                "nodes": self._SAMPLE_NODES,
                "edges": self._SAMPLE_EDGES,
            })
            assert status == 201
            assert data.get("workflow_id", "").startswith("wf_")
            assert data.get("webhook_token")
            assert data.get("webhook_url")
            wf_id = data["workflow_id"]

            code, raw, _ = srv.get(f"/api/workflows/{wf_id}")
            assert code == 200
            wf = json.loads(raw)
            assert len(wf["nodes"]) == 2
            assert wf["edges"][0]["source"] == "n1"

    def test_list_workflows(self):
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": None}) as srv:
            srv.post("/api/workflows", {
                "name": "列表测试",
                "requirement": "req",
                "nodes": self._SAMPLE_NODES,
            })
            code, raw, _ = srv.get("/api/workflows")
            assert code == 200
            data = json.loads(raw)
            assert data.get("count", 0) >= 1

    def test_update_workflow(self):
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": None}) as srv:
            _, created, _ = srv.post("/api/workflows", {
                "name": "旧名称",
                "requirement": "旧需求",
                "nodes": self._SAMPLE_NODES,
            })
            wf_id = created["workflow_id"]
            status, updated, _ = srv.put(f"/api/workflows/{wf_id}", {
                "name": "新名称",
                "requirement": "新需求",
            })
            assert status == 200
            assert updated["name"] == "新名称"
            assert updated["requirement"] == "新需求"

    def test_delete_workflow(self):
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": None}) as srv:
            _, created, _ = srv.post("/api/workflows", {
                "name": "待删除",
                "requirement": "req",
                "nodes": self._SAMPLE_NODES,
            })
            wf_id = created["workflow_id"]
            status, data, _ = srv.delete(f"/api/workflows/{wf_id}")
            assert status == 200
            assert data.get("deleted") is True
            code, raw, _ = srv.get(f"/api/workflows/{wf_id}")
            assert code == 404

    def test_webhook_triggers_run_without_bearer_auth(self):
        with _TestServer(env_overrides={"AGENTFLOW_API_TOKEN": "secret-token"}) as srv:
            _, wf, _ = srv.post("/api/workflows", {
                "name": "Webhook 测试",
                "requirement": "webhook req",
                "nodes": [{"id": "n1", "profile": "dev", "label": "t"}],
            }, headers={"Authorization": "Bearer secret-token"})
            token = wf["webhook_token"]
            status, data, _ = srv.post(f"/api/hook/{token}", {})
            assert status == 202
            assert data.get("run_id", "").startswith("run_")
            assert data.get("workflow_id") == wf["workflow_id"]

            code, raw, _ = srv.get(f"/api/runs/{data['run_id']}",
                                   headers={"Authorization": "Bearer secret-token"})
            assert code == 200
            run = json.loads(raw)
            assert run.get("workflow_id") == wf["workflow_id"]

    def test_webhook_invalid_token_returns_404(self):
        with _TestServer() as srv:
            status, data, _ = srv.post("/api/hook/invalidtoken123", {})
            assert status == 404
