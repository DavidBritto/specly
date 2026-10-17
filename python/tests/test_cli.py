"""Tests for Python CLI commands (init, doctor, plan, verify) and unsupported commands."""

import os
import subprocess
import sys
import tempfile
import unittest

from specly_cli.cli import main


class TestCliCommands(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_clean_python_project_init(self):
        # Must create spec files without creating package.json
        exit_code = main(["init", "--agent", "generic", "--feature", "test-feat"], root=self.root)
        self.assertEqual(exit_code, 0)
        self.assertFalse(os.path.exists(os.path.join(self.root, "package.json")))
        self.assertTrue(os.path.exists(os.path.join(self.root, "specs", "requirements.md")))
        self.assertTrue(os.path.exists(os.path.join(self.root, "specs", "steering.md")))
        self.assertTrue(os.path.exists(os.path.join(self.root, "specs", "how-to-use.md")))

    def test_skip_existing_and_force_overwrite(self):
        # First init creates file
        main(["init", "--agent", "generic", "--feature", "test-feat"], root=self.root)
        req_path = os.path.join(self.root, "specs", "requirements.md")
        with open(req_path, "w", encoding="utf-8") as f:
            f.write("MODIFIED REQUIREMENTS")

        # Second init without --force must NOT overwrite
        main(["init", "--agent", "generic", "--feature", "test-feat"], root=self.root)
        with open(req_path, "r", encoding="utf-8") as f:
            self.assertEqual(f.read(), "MODIFIED REQUIREMENTS")

        # Third init with --force must overwrite
        main(["init", "--agent", "generic", "--feature", "test-feat", "--force"], root=self.root)
        with open(req_path, "r", encoding="utf-8") as f:
            self.assertNotEqual(f.read(), "MODIFIED REQUIREMENTS")

    def test_unsupported_run_and_recover_fail(self):
        # run must exit with error and message indicating unsupported
        with self.assertRaises(SystemExit) as ctx:
            main(["run", "feat", "--task", "1.1"], root=self.root)
        self.assertNotEqual(ctx.exception.code, 0)

        with self.assertRaises(SystemExit) as ctx2:
            main(["recover", "feat", "--task", "1.1"], root=self.root)
        self.assertNotEqual(ctx2.exception.code, 0)

    def test_doctor_command_read_only(self):
        exit_code = main(["doctor"], root=self.root)
        self.assertEqual(exit_code, 0)
        # Should not write any files
        self.assertEqual(os.listdir(self.root), [])

    def test_plan_command_read_only(self):
        exit_code = main(["plan", "test-feat"], root=self.root)
        self.assertEqual(exit_code, 0)
        self.assertEqual(os.listdir(self.root), [])

    def test_verify_command_read_only(self):
        exit_code = main(["verify", "test-feat"], root=self.root)
        self.assertEqual(exit_code, 0)
        self.assertEqual(os.listdir(self.root), [])


if __name__ == "__main__":
    unittest.main()
