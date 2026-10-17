"""Node-free smoke test using an isolated local wheel and sanitized PATH."""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest


class TestWheelSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        cls.python_root = os.path.join(cls.repo_root, "python")
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.work_dir = cls.temp_dir.name

        # Build wheel locally without network
        dist_dir = os.path.join(cls.work_dir, "dist")
        subprocess.run(
            ["uv", "build", "--wheel", "--out-dir", dist_dir, "--no-sources"],
            cwd=cls.python_root,
            check=True,
            capture_output=True,
            text=True,
        )
        wheels = [f for f in os.listdir(dist_dir) if f.endswith(".whl")]
        assert len(wheels) == 1, f"Expected 1 wheel, found {wheels}"
        cls.wheel_path = os.path.join(dist_dir, wheels[0])

        # Create isolated venv
        cls.venv_dir = os.path.join(cls.work_dir, "venv")
        subprocess.run(["uv", "venv", cls.venv_dir], check=True, capture_output=True, text=True)

        # Install wheel with --no-index (offline)
        subprocess.run(
            ["uv", "pip", "install", "--no-index", cls.wheel_path],
            env={**os.environ, "VIRTUAL_ENV": cls.venv_dir},
            check=True,
            capture_output=True,
            text=True,
        )

        cls.specly_bin = os.path.join(cls.venv_dir, "bin", "specly")
        assert os.path.exists(cls.specly_bin), f"specly binary not found at {cls.specly_bin}"

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def _get_node_free_env(self):
        """Return an environment where node, npm, npx cannot be found."""
        clean_env = os.environ.copy()
        # Filter PATH to ensure no directory with node/npm/npx is included
        current_paths = clean_env.get("PATH", "").split(os.path.pathsep)
        sanitized_paths = [os.path.join(self.venv_dir, "bin")]
        for p in current_paths:
            if not any(os.path.exists(os.path.join(p, tool)) for tool in ["node", "npm", "npx"]):
                sanitized_paths.append(p)
        clean_env["PATH"] = os.path.pathsep.join(sanitized_paths)
        return clean_env

    def test_node_tools_are_absent_in_test_env(self):
        env = self._get_node_free_env()
        for tool in ["node", "npm", "npx"]:
            res = subprocess.run(["which", tool], env=env, capture_output=True)
            self.assertNotEqual(res.returncode, 0, f"{tool} should not be found in sanitized PATH")

    def test_node_free_clean_project_smoke(self):
        project_dir = os.path.join(self.work_dir, "clean-project")
        os.makedirs(project_dir, exist_ok=True)
        env = self._get_node_free_env()

        # 1. doctor
        doc_res = subprocess.run(
            [self.specly_bin, "doctor"],
            cwd=project_dir,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(doc_res.returncode, 0)
        self.assertIn("Specly doctor — read-only readiness check (Python)", doc_res.stdout)

        # 2. plan
        plan_res = subprocess.run(
            [self.specly_bin, "plan", "smoke-feat"],
            cwd=project_dir,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(plan_res.returncode, 0)
        self.assertIn("Specly plan — smoke-feat", plan_res.stdout)
        # Verify no files were created by doctor or plan
        self.assertEqual(os.listdir(project_dir), [])

        # 3. init
        init_res = subprocess.run(
            [self.specly_bin, "init", "--feature", "smoke-feat"],
            cwd=project_dir,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(init_res.returncode, 0)
        self.assertIn("SDD initialized", init_res.stdout)
        # Ensure no package.json was created
        self.assertFalse(os.path.exists(os.path.join(project_dir, "package.json")))
        self.assertTrue(os.path.exists(os.path.join(project_dir, "specs", "requirements.md")))

        # 4. verify
        ver_res = subprocess.run(
            [self.specly_bin, "verify", "smoke-feat"],
            cwd=project_dir,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(ver_res.returncode, 0)
        self.assertIn("Specly verify — smoke-feat", ver_res.stdout)

        # 5. run is rejected
        run_res = subprocess.run(
            [self.specly_bin, "run", "smoke-feat", "--task", "1.1"],
            cwd=project_dir,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(run_res.returncode, 0)
        self.assertIn("not supported in the Python CLI distribution", run_res.stderr)


if __name__ == "__main__":
    unittest.main()
