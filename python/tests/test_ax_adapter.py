"""Tests for optional AX cluster adapter boundaries, diagnostics, and preview."""

import os
import shutil
import sys
import tempfile
import unittest

from specly_cli.cli import main as cli_main


class TestAxAdapterBoundaries(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_default_commands_do_not_import_ax_or_probe_cluster(self):
        # Ensure 'ax_adapter' is not imported by default commands
        sys.modules.pop("specly_cli.optional.ax_adapter", None)
        old_env = os.environ.copy()
        try:
            # Set ambient KUBECONFIG
            os.environ["KUBECONFIG"] = "/nonexistent/fake/kubeconfig"
            code_doc = cli_main(["doctor"], root=self.root)
            self.assertEqual(code_doc, 0)
            code_plan = cli_main(["plan", "starter"], root=self.root)
            self.assertEqual(code_plan, 0)
        finally:
            os.environ.clear()
            os.environ.update(old_env)

        self.assertNotIn(
            "specly_cli.optional.ax_adapter",
            sys.modules,
            "AX adapter must be lazy and never imported by default CLI commands",
        )

    def test_prerequisite_diagnostics_offline_and_actionable(self):
        from specly_cli.optional.ax_adapter import check_prerequisites

        diag = check_prerequisites(binaries_checker=lambda name: False)
        self.assertFalse(diag.ready)
        self.assertIn("kubectl", diag.missing)
        self.assertIn("ko", diag.missing)
        self.assertIn("go", diag.missing)
        self.assertIn("actionable", diag.actionable_diagnostic.lower())

    def test_preview_binds_immutable_digest_without_submitting(self):
        from specly_cli.optional.ax_adapter import generate_ax_preview

        preview = generate_ax_preview(
            cluster_context="gke_project_us-central1_agent-cluster",
            namespace="specly-agents",
            operation="apply",
            resource_targets=["Task/task-1.1", "Workspace/ws-auth"],
            proposed_effects=["create Pod", "mount PVC"],
            compatibility_evidence="google-ax-prerelease",
        )
        self.assertTrue(preview.approval_digest)
        self.assertEqual(len(preview.approval_digest), 64)
        self.assertEqual(preview.operation, "apply")
        self.assertTrue(preview.is_mutation)

    def test_submission_requires_exact_approval_and_fails_on_change(self):
        from specly_cli.optional.ax_adapter import (
            generate_ax_preview,
            submit_ax_operation,
            AxAdapterError,
        )

        preview = generate_ax_preview(
            cluster_context="test-cluster",
            namespace="default",
            operation="apply",
            resource_targets=["Task/task-1.1"],
            proposed_effects=["create Pod"],
            compatibility_evidence="google-ax-prerelease",
        )

        dest_auth = {
            "destination": "test-cluster",
            "operation": "apply",
            "credential_session": "explicit-token-123",
        }

        # 1. Missing approval
        with self.assertRaises(AxAdapterError) as ctx:
            submit_ax_operation(preview, approval_digest="", destination_auth=dest_auth)
        self.assertIn("Approval digest required", str(ctx.exception))

        # 2. Mismatched approval
        with self.assertRaises(AxAdapterError) as ctx:
            submit_ax_operation(preview, approval_digest="wrong-digest", destination_auth=dest_auth)
        self.assertIn("Approval digest mismatch", str(ctx.exception))

        # 3. Missing destination authorization
        with self.assertRaises(AxAdapterError) as ctx:
            submit_ax_operation(
                preview,
                approval_digest=preview.approval_digest,
                destination_auth={"destination": "test-cluster"},  # missing operation and credential_session
            )
        self.assertIn("Missing explicit authorization", str(ctx.exception))

        # 4. Successful mock submit with exact approval and auth
        res = submit_ax_operation(
            preview,
            approval_digest=preview.approval_digest,
            destination_auth=dest_auth,
            submit_fn=lambda p: {"status": "mock_submitted", "digest": p.approval_digest},
        )
        self.assertEqual(res["status"], "mock_submitted")


if __name__ == "__main__":
    unittest.main()
