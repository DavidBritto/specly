"""Tests for Python artifact contract and layout validation."""

import os
import tempfile
import unittest

from specly_cli.contract import ContractError, load_contract, validate_contract, resolve_artifacts
from specly_cli.layout import resolve_layout, LayoutError


class TestContractValidation(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_rejects_unknown_contract_name_or_version(self):
        bad_contract = {
            "contract": "unknown-contract",
            "contractVersion": "2.0.0",
            "schemaVersion": 99,
            "artifacts": [],
            "layouts": {},
        }
        with self.assertRaises(ContractError) as ctx:
            validate_contract(bad_contract)
        self.assertIn("Unsupported contract", str(ctx.exception))

    def test_rejects_unsafe_feature_name(self):
        for unsafe_feature in ["../escape", "sub/dir", "..", "foo/bar"]:
            with self.assertRaises(LayoutError):
                resolve_layout("generic", unsafe_feature, self.root)

    def test_rejects_path_escape_or_symlink_in_layout(self):
        # Create a symlink pointing outside root
        outside_tmp = tempfile.TemporaryDirectory()
        outside = outside_tmp.name
        link = os.path.join(self.root, ".cursor")
        os.symlink(outside, link)

        try:
            with self.assertRaises(LayoutError):
                resolve_layout("cursor", "feature1", self.root)
        finally:
            outside_tmp.cleanup()

    def test_rejects_tampered_template_fingerprint(self):
        tampered_artifact = {
            "id": "requirements",
            "role": "feature specification",
            "directory": "specsDir",
            "file": "requirements.md",
            "template": "src/templates/requirements.md",
            "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
            "ownership": "user",
        }
        contract = {
            "contract": "specly-generated-artifacts",
            "contractVersion": "1.0.0",
            "schemaVersion": 1,
            "featurePlaceholder": "{feature}",
            "artifacts": [tampered_artifact],
            "layouts": {"generic": {"specsDir": "specs", "steeringDir": "specs", "agentDir": "specs"}},
        }
        with self.assertRaises(ContractError) as ctx:
            resolve_artifacts(contract, "generic", "feat1", self.root)
        self.assertIn("fingerprint mismatch", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
