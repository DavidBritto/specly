"""Tests for deterministic asset synchronization and drift detection."""

import os
import subprocess
import sys
import tempfile
import unittest


class TestSyncAssets(unittest.TestCase):
    def setUp(self):
        self.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.sync_script = os.path.join(self.repo_root, "python", "scripts", "sync_assets.py")

    def test_sync_script_exists(self):
        self.assertTrue(os.path.exists(self.sync_script), f"Expected sync script at {self.sync_script}")

    def test_check_mode_passes_on_current_clean_repo(self):
        res = subprocess.run(
            [sys.executable, self.sync_script, "--check"],
            cwd=self.repo_root,
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"sync_assets --check failed:\n{res.stdout}\n{res.stderr}")
        self.assertIn("Assets are synchronized", res.stdout)

    def test_check_mode_detects_tampered_asset(self):
        target_asset = os.path.join(
            self.repo_root, "python", "src", "specly_cli", "assets", "templates", "requirements.md"
        )
        with open(target_asset, "r", encoding="utf-8") as f:
            original = f.read()

        try:
            with open(target_asset, "w", encoding="utf-8") as f:
                f.write("DRIFT DETECTED")

            res = subprocess.run(
                [sys.executable, self.sync_script, "--check"],
                cwd=self.repo_root,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(res.returncode, 0)
            self.assertIn("mismatch", res.stderr + res.stdout)
        finally:
            with open(target_asset, "w", encoding="utf-8") as f:
                f.write(original)


if __name__ == "__main__":
    unittest.main()
