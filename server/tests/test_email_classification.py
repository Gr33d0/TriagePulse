import unittest
from unittest.mock import patch

from helpers import ollama_client


class OllamaStub:
    class ResponseError(Exception):
        pass

    def __init__(self, response: str) -> None:
        self.response = response
        self.prompt = ""

    def generate(
        self,
        *,
        model: str,
        prompt: str,
        options: dict[str, int],
        format: str | None = None,
    ) -> dict[str, str]:
        self.prompt = prompt
        self.model = model
        self.format = format
        self.options = options
        return {"response": self.response}


class EmailClassificationTests(unittest.TestCase):
    examples = (
        (
            "O sistema está fora do ar e todos os pedidos estão parados",
            "High",
        ),
        ("A cobrança deste mês parece incorreta, podem verificar?", "Medium"),
        ("Qual é o horário de atendimento durante os feriados?", "Low"),
    )

    def test_analysis_returns_expected_priority_for_synthetic_examples(self) -> None:
        for body, expected_priority in self.examples:
            with self.subTest(priority=expected_priority):
                ollama = OllamaStub(
                    '{"summary":"Customer email",'
                    f'"urgency":"{expected_priority}"' + "}"
                )
                with patch.object(ollama_client, "ollama", ollama):
                    analysis = ollama_client.analyze_email("Support request", body)

                self.assertEqual(analysis.urgency, expected_priority)
                self.assertIn(body, ollama.prompt)
                self.assertIn("Apply these thresholds strictly", ollama.prompt)
                self.assertIn("When uncertain between High and Medium, choose Medium", ollama.prompt)
                self.assertEqual(ollama.options, {"temperature": 0})

    def test_prompt_reserves_high_priority_for_serious_immediate_impact(self) -> None:
        ollama = OllamaStub('{"summary":"Customer email","urgency":"Medium"}')
        with patch.object(ollama_client, "ollama", ollama):
            ollama_client.analyze_email(
                "Error exporting history",
                "Monthly exports work, but the annual export fails.",
            )

        self.assertIn("High only when there is an active or imminent serious risk", ollama.prompt)
        self.assertIn("available workarounds", ollama.prompt)
        self.assertIn("Do not use High just because a customer asks for help", ollama.prompt)
        self.assertIn("before next week's invoice is issued", ollama.prompt)

    def test_analysis_rejects_priorities_outside_the_scale(self) -> None:
        ollama = OllamaStub(
            '{"summary":"Customer email","urgency":"Critical"}'
        )
        with patch.object(ollama_client, "ollama", ollama):
            with self.assertRaises(ollama_client.EmailAnalysisError):
                ollama_client.analyze_email("Service issue", "The service is unavailable")

    def test_reply_suggestion_uses_style_example_and_returns_text(self) -> None:
        ollama = OllamaStub(" Olá, obrigado pelo contacto.\n\nCumprimentos ")
        with patch.object(ollama_client, "ollama", ollama):
            suggestion = ollama_client.suggest_email_reply(
                "Acesso à conta",
                "Não consigo entrar na minha conta.",
                "Olá,\n\nObrigado pelo contacto.\n\nCumprimentos",
            )

        self.assertEqual(suggestion, "Olá, obrigado pelo contacto.\n\nCumprimentos")
        self.assertIn("same language as the customer's email", ollama.prompt)
        self.assertIn("Acesso à conta", ollama.prompt)
        self.assertIn("Cumprimentos", ollama.prompt)
        self.assertIsNone(ollama.format)
        self.assertEqual(ollama.options, {"temperature": 0})

    def test_reply_suggestion_rejects_empty_response(self) -> None:
        ollama = OllamaStub("  ")
        with patch.object(ollama_client, "ollama", ollama):
            with self.assertRaises(ollama_client.EmailAnalysisError):
                ollama_client.suggest_email_reply("Support request", "Please help.")


if __name__ == "__main__":
    unittest.main()
