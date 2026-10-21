# Receive unread email subjects from a Gmail account using IMAP.
from collections.abc import Iterator
from dataclasses import dataclass
from email import message_from_bytes
from email.header import decode_header, make_header
from email.utils import parseaddr
import imaplib
import os

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class FetchedEmail:
    sender: str
    subject: str
    body: str
    mailbox: str


def _decode_header_value(value: str | None) -> str:
    return str(make_header(decode_header(value))) if value else ""


def _get_text_body(message) -> str:
    parts = message.walk() if message.is_multipart() else [message]
    for part in parts:
        if part.get_content_type() != "text/plain":
            continue
        if part.get_content_disposition() == "attachment":
            continue

        payload = part.get_payload(decode=True)
        if payload is None:
            content = part.get_payload()
            return content if isinstance(content, str) else ""
        return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
    return ""


def get_unseen_emails() -> Iterator[FetchedEmail]:
    imap_url = os.getenv("EMAIL_IMAP_URL")
    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")
    if not imap_url or not user or not password:
        raise ValueError("EMAIL_IMAP_URL, EMAIL_USER, and EMAIL_PASSWORD must be configured")

    connection = imaplib.IMAP4_SSL(imap_url)
    logged_in = False
    try:
        connection.login(user, password)
        logged_in = True

        status, _ = connection.select("Inbox")
        if status != "OK":
            raise imaplib.IMAP4.error("Could not select the Inbox")

        status, data = connection.uid("search", None, "UNSEEN")
        if status != "OK":
            raise imaplib.IMAP4.error("Could not search for unread email")

        for message_uid in data[0].split():
            uid = int(message_uid)
            status, message_data = connection.uid("fetch", message_uid, "(BODY.PEEK[])")
            if status != "OK":
                raise imaplib.IMAP4.error(f"Could not fetch email {uid}")

            raw_message = next(
                (part[1] for part in message_data if isinstance(part, tuple)),
                None,
            )
            if raw_message is None:
                raise imaplib.IMAP4.error(f"Email {uid} had no message data")

            message = message_from_bytes(raw_message)
            _, sender_email = parseaddr(_decode_header_value(message.get("From")))
            email = FetchedEmail(
                sender=sender_email,
                subject=_decode_header_value(message.get("Subject")),
                body=_get_text_body(message),
                mailbox=user,
            )
            yield email

            status, _ = connection.uid("store", message_uid, "+FLAGS", "(\\Seen)")
            if status != "OK":
                raise imaplib.IMAP4.error(f"Could not mark email {uid} as read")
    finally:
        if logged_in:
            connection.logout()