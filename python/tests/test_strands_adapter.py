"""Tests for optional Strands task execution adapter and safety boundaries."""

import os
import sys
import tempfile
import unittest

from specly_cli.cli import main as cli_main


class TestStrandsAdapterBoundaries(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_default_commands_do_not_import_strands(self):
        # Ensure 'strands' or 'specly_cli.optional.strands_adapter' are not in sys.modules
        sys.modules.pop("specly_cli.optional.strands_adapter", None)
        sys.modules.pop("strands", None)

        # Run doctor and plan with dummy ambient credentials set
        ambient_env = {
            **os.environ,
            "AWS_ACCESS_KEY_ID": "fake-aws-key",
            "OPENAI_API_KEY": "fake-openai-key",
        }
        old_env = os.environ.copy()
        try:
            os.environ.clear()
            os.environ.update(ambient_env)
            code_doc = cli_main(["doctor"], root=self.root)
            self.assertEqual(code_doc, 0)
            code_plan = cli_main(["plan", "starter"], root=self.root)
            self.assertEqual(code_plan, 0)
        finally:
            os.environ.clear()
            os.environ.update(old_env)

        self.assertNotIn(
            "specly_cli.optional.strands_adapter",
            sys.modules,
            "Strands adapter should be lazily loaded and not imported by default commands",
        )

    def test_refuses_when_approval_is_missing_or_mismatched(self):
        from specly_cli.optional.strands_adapter import (
            ExecutionRequest,
            execute_task,
            StrandsAdapterError,
        )

        req = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="ollama",
            provider_config={"host": "http://localhost:11434", "model_id": "llama3"},
            tool_allowlist=["write-file"],
            writable_roots=[os.path.join(self.root, "specs")],
            budget_calls=5,
            timeout_seconds=10.0,
            approval_digest="expected-digest-1234",
        )

        # Mismatched approval
        with self.assertRaises(StrandsAdapterError) as ctx:
            execute_task(req, provided_approval="wrong-digest")
        self.assertIn("Approval digest mismatch", str(ctx.exception))

        # Missing approval
        with self.assertRaises(StrandsAdapterError) as ctx:
            execute_task(req, provided_approval="")
        self.assertIn("Approval required", str(ctx.exception))

    def test_refuses_when_provider_config_missing(self):
        from specly_cli.optional.strands_adapter import (
            ExecutionRequest,
            execute_task,
            StrandsAdapterError,
        )

        req = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="",
            provider_config={},
            tool_allowlist=["write-file"],
            writable_roots=[os.path.join(self.root, "specs")],
            budget_calls=5,
            timeout_seconds=10.0,
            approval_digest="test-digest",
        )

        with self.assertRaises(StrandsAdapterError) as ctx:
            execute_task(req, provided_approval="test-digest")
        self.assertIn("Missing provider configuration", str(ctx.exception))

    def test_refuses_unauthorized_tools_or_path_escape(self):
        from specly_cli.optional.strands_adapter import (
            ExecutionRequest,
            execute_task,
            StrandsAdapterError,
        )

        # Disallowed tool
        req_bad_tool = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="ollama",
            provider_config={"host": "http://localhost:11434"},
            tool_allowlist=["shell_exec"],
            writable_roots=[self.root],
            budget_calls=5,
            timeout_seconds=10.0,
            approval_digest="test-digest",
        )
        with self.assertRaises(StrandsAdapterError) as ctx:
            execute_task(req_bad_tool, provided_approval="test-digest")
        self.assertIn("Disallowed tool", str(ctx.exception))

        # Writable root escape
        req_escape = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="ollama",
            provider_config={"host": "http://localhost:11434"},
            tool_allowlist=["write-file"],
            writable_roots=["/etc"],
            budget_calls=5,
            timeout_seconds=10.0,
            approval_digest="test-digest",
        )
        with self.assertRaises(StrandsAdapterError) as ctx:
            execute_task(req_escape, provided_approval="test-digest")
        self.assertIn("escapes project root", str(ctx.exception))

        # Reserved directory target (.git or .specly)
        req_reserved = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="ollama",
            provider_config={"host": "http://localhost:11434"},
            tool_allowlist=["write-file"],
            writable_roots=[os.path.join(self.root, ".git")],
            budget_calls=5,
            timeout_seconds=10.0,
            approval_digest="test-digest",
        )
        with self.assertRaises(StrandsAdapterError) as ctx:
            execute_task(req_reserved, provided_approval="test-digest")
        self.assertIn("reserved directory", str(ctx.exception))

    def test_budget_exhaustion_stops_execution(self):
        from specly_cli.optional.strands_adapter import (
            ExecutionRequest,
            execute_task,
        )

        req = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="mock",
            provider_config={"mock": True},
            tool_allowlist=["write-file"],
            writable_roots=[self.root],
            budget_calls=0,  # 0 budget
            timeout_seconds=10.0,
            approval_digest="test-digest",
        )
        record = execute_task(req, provided_approval="test-digest")
        self.assertEqual(record.status, "limited")
        self.assertFalse(record.acceptance_verified)
        self.assertIn("Budget exceeded", record.error_message)

    def test_successful_execution_record_does_not_verify_acceptance(self):
        from specly_cli.optional.strands_adapter import (
            ExecutionRequest,
            execute_task,
        )

        # Setup a tasks.md
        specs_dir = os.path.join(self.root, "specs")
        os.makedirs(specs_dir, exist_ok=True)
        tasks_file = os.path.join(specs_dir, "tasks.md")
        with open(tasks_file, "w", encoding="utf-8") as f:
            f.write("# Tasks\n\n- [ ] 1.1 First task\n")

        req = ExecutionRequest(
            task_id="1.1",
            feature="auth",
            project_root=self.root,
            provider_destination="mock",
            provider_config={"mock": True},
            tool_allowlist=["write-file"],
            writable_roots=[self.root],
            budget_calls=5,
            timeout_seconds=10.0,
            approval_digest="test-digest",
        )
        record = execute_task(req, provided_approval="test-digest")
        self.assertEqual(record.status, "completed")
        self.assertFalse(record.acceptance_verified)

        # Check tasks.md is still UNCHECKED: execution does NOT mark tasks checked
        with open(tasks_file, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("- [ ] 1.1 First task", content)


if __name__ == "__main__":
    unittest.main()
