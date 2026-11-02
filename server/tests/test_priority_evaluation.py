import unittest
from collections import Counter

from scripts.evaluate_priority_model import (
    DEFAULT_DATASET,
    calculate_metrics,
    load_dataset,
)


class PriorityEvaluationTests(unittest.TestCase):
    def test_synthetic_dataset_has_balanced_labels(self) -> None:
        examples = load_dataset(DEFAULT_DATASET)

        self.assertEqual(len(examples), 30)
        self.assertEqual(
            Counter(example.expected_urgency for example in examples),
            {"High": 10, "Medium": 10, "Low": 10},
        )

    def test_metrics_calculate_accuracy_and_confusion_matrix(self) -> None:
        report = calculate_metrics(
            ["High", "High", "Medium", "Low"],
            ["High", "Medium", "Medium", "Low"],
        )

        self.assertEqual(report["accuracy"], 0.75)
        self.assertEqual(report["confusion"]["High"]["Medium"], 1)
        self.assertEqual(report["per_class"]["High"]["recall"], 0.5)

    def test_metrics_reject_different_number_of_labels(self) -> None:
        with self.assertRaises(ValueError):
            calculate_metrics(["High"], ["High", "Low"])

    def test_metrics_reject_unknown_labels(self) -> None:
        with self.assertRaises(ValueError):
            calculate_metrics(["Critical"], ["High"])


if __name__ == "__main__":
    unittest.main()
