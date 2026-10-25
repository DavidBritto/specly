"""Cross-runtime conformance tests comparing Node.js CLI and Python CLI outputs."""

import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest

from specly_cli.cli import main as python_main


def compute_file_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


class TestCrossRuntimeConformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        cls.node_cli = os.path.join(cls.repo_root, "src", "index.js")
        contract_path = os.path.join(cls.repo_root, "contracts", "artifact-contract-v1.json")
        with open(contract_path, "r", encoding="utf-8") as f:
            cls.contract = json.load(f)

    def run_node_cli(self, project_dir: str, args: list) -> subprocess.CompletedProcess:
        cmd = ["node", self.node_cli, *args]
        return subprocess.run(
            cmd,
            cwd=project_dir,
            capture_output=True,
            text=True,
            env={**os.environ, "SDD_NO_OPEN": "1"},
        )

    def test_conformance_init_across_all_agent_layouts(self):
        feature = "conformance-feat"
        layouts = self.contract["layouts"]

        for agent in layouts.keys():
            with self.subTest(agent=agent):
                node_dir = tempfile.mkdtemp()
                python_dir = tempfile.mkdtemp()
                try:
                    # If agent uses specific directory markers, create them
                    if agent == "agents":
                        os.makedirs(os.path.join(node_dir, ".agents"), exist_ok=True)
                        os.makedirs(os.path.join(python_dir, ".agents"), exist_ok=True)
                    elif agent == "cursor":
                        os.makedirs(os.path.join(node_dir, ".cursor"), exist_ok=True)
                        os.makedirs(os.path.join(python_dir, ".cursor"), exist_ok=True)
                    elif agent == "kiro":
                        os.makedirs(os.path.join(node_dir, ".kiro"), exist_ok=True)
                        os.makedirs(os.path.join(python_dir, ".kiro"), exist_ok=True)
                    elif agent == "vscode":
                        os.makedirs(os.path.join(node_dir, ".vscode"), exist_ok=True)
                        os.makedirs(os.path.join(python_dir, ".vscode"), exist_ok=True)

                    # 1. Run Node CLI init
                    node_res = self.run_node_cli(node_dir, ["init", "--agent", agent, "--feature", feature])
                    self.assertEqual(node_res.returncode, 0, f"Node init failed for {agent}: {node_res.stderr}")

                    # 2. Run Python CLI init
                    py_code = python_main(["init", "--agent", agent, "--feature", feature], root=python_dir)
                    self.assertEqual(py_code, 0, f"Python init failed for {agent}")

                    # 3. Compare all artifacts in contract
                    for artifact in self.contract["artifacts"]:
                        art_id = artifact["id"]
                        file_name = artifact["file"]
                        dir_key = artifact["directory"]
                        rel_dir = layouts[agent][dir_key].replace("{feature}", feature)

                        node_file = os.path.join(node_dir, rel_dir, file_name)
                        python_file = os.path.join(python_dir, rel_dir, file_name)

                        self.assertTrue(
                            os.path.exists(node_file),
                            f"Node file missing for {agent} artifact {art_id}: {node_file}",
                        )
                        self.assertTrue(
                            os.path.exists(python_file),
                            f"Python file missing for {agent} artifact {art_id}: {python_file}",
                        )

                        node_sha = compute_file_sha256(node_file)
                        python_sha = compute_file_sha256(python_file)

                        # Must match exact canonical contract sha256
                        self.assertEqual(
                            node_sha,
                            artifact["sha256"],
                            f"Node SHA mismatch for {agent} {art_id}",
                        )
                        self.assertEqual(
                            python_sha,
                            artifact["sha256"],
                            f"Python SHA mismatch for {agent} {art_id}",
                        )
                        # Must match each other byte-for-byte
                        self.assertEqual(
                            node_sha,
                            python_sha,
                            f"Cross-runtime divergence for {agent} artifact {art_id}",
                        )
                finally:
                    import shutil
                    shutil.rmtree(node_dir, ignore_errors=True)
                    shutil.rmtree(python_dir, ignore_errors=True)

    def test_conformance_skip_existing_and_force(self):
        feature = "overwrite-test"
        agent = "generic"

        node_dir = tempfile.mkdtemp()
        python_dir = tempfile.mkdtemp()
        try:
            # Init both
            self.run_node_cli(node_dir, ["init", "--agent", agent, "--feature", feature])
            python_main(["init", "--agent", agent, "--feature", feature], root=python_dir)

            # Modify a file in both
            req_node = os.path.join(node_dir, "specs", "requirements.md")
            req_py = os.path.join(python_dir, "specs", "requirements.md")
            with open(req_node, "w") as f:
                f.write("MODIFIED NODE")
            with open(req_py, "w") as f:
                f.write("MODIFIED PYTHON")

            # Re-run without force
            self.run_node_cli(node_dir, ["init", "--agent", agent, "--feature", feature])
            python_main(["init", "--agent", agent, "--feature", feature], root=python_dir)

            with open(req_node, "r") as f:
                self.assertEqual(f.read(), "MODIFIED NODE")
            with open(req_py, "r") as f:
                self.assertEqual(f.read(), "MODIFIED PYTHON")

            # Re-run with force
            self.run_node_cli(node_dir, ["init", "--agent", agent, "--feature", feature, "--force"])
            python_main(["init", "--agent", agent, "--feature", feature, "--force"], root=python_dir)

            node_sha = compute_file_sha256(req_node)
            py_sha = compute_file_sha256(req_py)
            expected_sha = next(a["sha256"] for a in self.contract["artifacts"] if a["id"] == "requirements")
            self.assertEqual(node_sha, expected_sha)
            self.assertEqual(py_sha, expected_sha)
        finally:
            import shutil
            shutil.rmtree(node_dir, ignore_errors=True)
            shutil.rmtree(python_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
