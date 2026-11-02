import unittest
from unittest.mock import MagicMock, patch

import httpx

from services import connection_checks


class ConnectionChecksTests(unittest.TestCase):
    def test_database_check_returns_true_when_query_succeeds(self) -> None:
        connection = MagicMock()
        connection_context = MagicMock()
        connection_context.__enter__.return_value = connection

        with patch.object(connection_checks, "engine") as engine:
            engine.connect.return_value = connection_context

            connected = connection_checks.check_database_connection()

        self.assertTrue(connected)
        connection.execute.assert_called_once()

    def test_gmail_check_returns_false_when_credentials_are_missing(self) -> None:
        with (
            patch.dict("os.environ", {}, clear=True),
            patch.object(connection_checks.imaplib, "IMAP4_SSL") as imap,
        ):
            connected = connection_checks.check_gmail_connection()

        self.assertFalse(connected)
        imap.assert_not_called()

    def test_gmail_check_logs_in_and_logs_out(self) -> None:
        connection = MagicMock()
        with (
            patch.dict(
                "os.environ",
                {
                    "EMAIL_IMAP_URL": "imap.example.com",
                    "EMAIL_USER": "user@example.com",
                    "EMAIL_PASSWORD": "password",
                },
                clear=True,
            ),
            patch.object(
                connection_checks.imaplib,
                "IMAP4_SSL",
                return_value=connection,
            ) as imap,
        ):
            connected = connection_checks.check_gmail_connection()

        self.assertTrue(connected)
        imap.assert_called_once_with("imap.example.com", timeout=5)
        connection.login.assert_called_once_with("user@example.com", "password")
        connection.logout.assert_called_once()

    def test_ollama_check_returns_false_when_package_is_missing(self) -> None:
        with patch.object(connection_checks.ollama_client, "ollama", None):
            connected = connection_checks.check_ollama_connection()

        self.assertFalse(connected)

    def test_ollama_check_lists_models_when_service_is_reachable(self) -> None:
        ollama = MagicMock()
        with patch.object(connection_checks.ollama_client, "ollama", ollama):
            connected = connection_checks.check_ollama_connection()

        self.assertTrue(connected)
        ollama.Client.assert_called_once_with(timeout=5)
        ollama.Client.return_value.list.assert_called_once()

    def test_ollama_check_returns_false_when_service_is_unreachable(self) -> None:
        ollama = MagicMock()
        ollama.ResponseError = type("ResponseError", (Exception,), {})
        ollama.Client.return_value.list.side_effect = httpx.ConnectError("offline")
        with patch.object(connection_checks.ollama_client, "ollama", ollama):
            connected = connection_checks.check_ollama_connection()

        self.assertFalse(connected)


if __name__ == "__main__":
    unittest.main()
