import imaplib
import logging
import os

import httpx
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database.postgreSQL import engine
from helpers import ollama_client

logger = logging.getLogger(__name__)


def check_database_connection() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        logger.warning("Database is not reachable")
        return False


def check_gmail_connection() -> bool:
    imap_url = os.getenv("EMAIL_IMAP_URL")
    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")
    if not imap_url or not user or not password:
        logger.warning("Gmail IMAP is not configured")
        return False

    connection = None
    logged_in = False
    try:
        connection = imaplib.IMAP4_SSL(imap_url, timeout=5)
        connection.login(user, password)
        logged_in = True
        return True
    except (imaplib.IMAP4.error, OSError):
        logger.warning("Gmail IMAP is not reachable or authentication failed")
        return False
    finally:
        if connection is not None and logged_in:
            try:
                connection.logout()
            except (imaplib.IMAP4.error, OSError):
                logger.warning("Could not close the Gmail IMAP connection cleanly")


def check_ollama_connection() -> bool:
    ollama = ollama_client.ollama
    if ollama is None:
        logger.warning("Ollama Python package is not installed")
        return False

    try:
        ollama.Client(timeout=5).list()
        return True
    except (httpx.HTTPError, ollama.ResponseError):
        logger.warning("Ollama service is not reachable")
        return False


def check_connections() -> dict[str, bool]:
    return {
        "database": check_database_connection(),
        "gmail": check_gmail_connection(),
        "ollama": check_ollama_connection(),
    }
