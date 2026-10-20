import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("video_gate.py")


class VideoGateTests(unittest.TestCase):
    def run_gate(self, *args, ok=True):
        result = subprocess.run([sys.executable, str(SCRIPT), *args], text=True, capture_output=True)
        self.assertEqual(result.returncode == 0, ok, result.stdout + result.stderr)
        return result

    def test_scoring_threshold_and_floor(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as folder:
            path = Path(folder) / "review.json"
            observations = [{"timestamp": "00:01.000", "dimension": key} for key in ("reference_fidelity", "motion", "composition", "pacing", "polish")]
            review = {"review_version": "v1", "inspected_directly": True, "reference_access": "verified", "scores": {"reference_fidelity": 78, "motion": 98, "composition": 98, "pacing": 98, "polish": 98}, "observations": observations, "blocking_defects": []}
            path.write_text(json.dumps(review), encoding="utf-8")
            self.run_gate("score", "--review", str(path))
            scored = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(scored["decision"], "REVISE_MAJOR")
            self.assertGreater(scored["weighted_total"], 90)

    def test_unverified_reference_is_not_scorable(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as folder:
            path = Path(folder) / "review.json"
            review = {"review_version": "v1", "inspected_directly": True, "reference_access": "unverified", "scores": {"reference_fidelity": "not_scorable"}, "observations": [], "blocking_defects": []}
            path.write_text(json.dumps(review), encoding="utf-8")
            self.run_gate("score", "--review", str(path), ok=False)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["decision"], "CONCEPT_ONLY_REVIEW")


if __name__ == "__main__": unittest.main()
