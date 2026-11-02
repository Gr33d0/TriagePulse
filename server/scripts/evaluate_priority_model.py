import argparse
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence, TypedDict

from helpers.ollama_client import EmailAnalysisError, analyze_email

LABELS = ("High", "Medium", "Low")
DEFAULT_DATASET = (
    Path(__file__).resolve().parents[1]
    / "tests"
    / "fixtures"
    / "priority_dataset.csv"
)


class ClassMetrics(TypedDict):
    support: int
    precision: float
    recall: float
    f1: float


class EvaluationMetrics(TypedDict):
    accuracy: float
    confusion: dict[str, dict[str, int]]
    per_class: dict[str, ClassMetrics]


@dataclass(frozen=True)
class EvaluationExample:
    id: str
    title: str
    body: str
    expected_urgency: str
    rationale: str


def load_dataset(path: Path) -> list[EvaluationExample]:
    with path.open(encoding="utf-8", newline="") as dataset_file:
        reader = csv.DictReader(dataset_file)
        required_columns = {
            "id",
            "title",
            "body",
            "expected_urgency",
            "rationale",
        }
        if reader.fieldnames is None or not required_columns.issubset(reader.fieldnames):
            raise ValueError(
                f"Dataset must contain these columns: {', '.join(sorted(required_columns))}"
            )

        examples = []
        seen_ids = set()
        for row_number, row in enumerate(reader, start=2):
            example = EvaluationExample(
                id=(row["id"] or "").strip(),
                title=(row["title"] or "").strip(),
                body=(row["body"] or "").strip(),
                expected_urgency=(row["expected_urgency"] or "").strip(),
                rationale=(row["rationale"] or "").strip(),
            )
            if not all(
                (
                    example.id,
                    example.title,
                    example.body,
                    example.expected_urgency,
                    example.rationale,
                )
            ):
                raise ValueError(f"Dataset row {row_number} has an empty field")
            if example.id in seen_ids:
                raise ValueError(f"Dataset contains duplicate id {example.id!r}")
            if example.expected_urgency not in LABELS:
                raise ValueError(
                    f"Dataset row {row_number} has invalid priority "
                    f"{example.expected_urgency!r}"
                )
            seen_ids.add(example.id)
            examples.append(example)

    if not examples:
        raise ValueError("Dataset contains no examples")
    return examples


def calculate_metrics(
    expected: Sequence[str],
    predicted: Sequence[str],
) -> EvaluationMetrics:
    if not expected or len(expected) != len(predicted):
        raise ValueError("Expected and predicted labels must have the same nonzero length")
    if any(label not in LABELS for label in (*expected, *predicted)):
        raise ValueError(f"Labels must be one of: {', '.join(LABELS)}")

    confusion = {label: {guess: 0 for guess in LABELS} for label in LABELS}
    for actual, guess in zip(expected, predicted):
        confusion[actual][guess] += 1

    per_class: dict[str, ClassMetrics] = {}
    for label in LABELS:
        true_positive = confusion[label][label]
        actual_count = sum(confusion[label].values())
        predicted_count = sum(confusion[actual][label] for actual in LABELS)
        precision = true_positive / predicted_count if predicted_count else 0.0
        recall = true_positive / actual_count if actual_count else 0.0
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall
            else 0.0
        )
        per_class[label] = {
            "support": actual_count,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }

    accuracy = sum(
        confusion[label][label] for label in LABELS
    ) / len(expected)
    return {
        "accuracy": accuracy,
        "confusion": confusion,
        "per_class": per_class,
    }


def print_report(
    examples: Sequence[EvaluationExample],
    predictions: Sequence[str],
    metrics: EvaluationMetrics,
    model: str,
) -> None:
    per_class = metrics["per_class"]
    confusion = metrics["confusion"]
    print(f"Modelo: {model}")
    print(f"Exemplos: {len(examples)}")
    print(f"Accuracy: {metrics['accuracy']:.1%}")
    print("\nMétricas por prioridade (precision / recall / F1 / suporte):")
    for label in LABELS:
        scores = per_class[label]
        print(
            f"  {label:6} "
            f"{scores['precision']:.1%} / {scores['recall']:.1%} / "
            f"{scores['f1']:.1%} / {scores['support']}"
        )

    print("\nMatriz de confusão (linha = real, coluna = prevista):")
    print(f"  {'':8}{' '.join(f'{label:>8}' for label in LABELS)}")
    for label in LABELS:
        counts = " ".join(f"{confusion[label][guess]:>8}" for guess in LABELS)
        print(f"  {label:8}{counts}")

    errors = [
        (example, prediction)
        for example, prediction in zip(examples, predictions)
        if example.expected_urgency != prediction
    ]
    if errors:
        print("\nClassificações incorretas:")
        for example, prediction in errors:
            print(
                f"  {example.id}: esperado {example.expected_urgency}, "
                f"previsto {prediction} - {example.title}"
            )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Avalia a prioridade de resolução prevista pelo Ollama."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Caminho para um CSV rotulado (default: dataset sintético do projeto).",
    )
    parser.add_argument(
        "--model",
        default="llama3.2:latest",
        help="Modelo local do Ollama a avaliar.",
    )
    args = parser.parse_args()

    try:
        examples = load_dataset(args.dataset)
    except (OSError, csv.Error, ValueError) as error:
        parser.error(str(error))

    predictions = []
    for example in examples:
        try:
            analysis = analyze_email(example.title, example.body, model=args.model)
        except EmailAnalysisError as error:
            raise SystemExit(f"Erro ao avaliar exemplo {example.id}: {error}") from error
        predictions.append(analysis.urgency)

    metrics = calculate_metrics(
        [example.expected_urgency for example in examples],
        predictions,
    )
    print_report(examples, predictions, metrics, args.model)


if __name__ == "__main__":
    main()
