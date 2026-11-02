# Receive unread email subjects from a Gmail account using IMAP.
from collections.abc import Iterator
from dataclasses import dataclass
from email import message_from_bytes
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.utils import parseaddr
import imaplib
import os
import re
import smtplib
import ssl

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class FetchedEmail:
    sender: str
    subject: str
    body: str
    mailbox: str
    reply_to: str | None
    message_id: str | None
    references_header: str | None
    can_reply: bool


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


def _valid_email_address(address: str) -> bool:
    return re.fullmatch(r"[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+", address) is not None


def is_reply_address(address: str) -> bool:
    if not _valid_email_address(address):
        return False
    local_part = address.split("@", maxsplit=1)[0].lower()
    return re.search(r"no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer[-_.]?daemon", local_part) is None


def _can_reply(message, reply_address: str, sender_address: str) -> bool:
    auto_submitted = message.get("Auto-Submitted", "no").strip().lower()
    precedence = message.get("Precedence", "").strip().lower()
    if auto_submitted != "no" or precedence in {"bulk", "list", "junk"}:
        return False
    if not is_reply_address(reply_address) or not is_reply_address(sender_address):
        return False
    return True


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
            reply_header = message.get("Reply-To")
            _, reply_address = parseaddr(_decode_header_value(reply_header)) if reply_header else ("", "")
            reply_address = reply_address or sender_email
            email = FetchedEmail(
                sender=sender_email,
                subject=_decode_header_value(message.get("Subject")),
                body=_get_text_body(message),
                mailbox=user,
                reply_to=reply_address if _valid_email_address(reply_address) else None,
                message_id=message.get("Message-ID"),
                references_header=message.get("References"),
                can_reply=_can_reply(message, reply_address, sender_email),
            )
            yield email

            status, _ = connection.uid("store", message_uid, "+FLAGS", "(\\Seen)")
            if status != "OK":
                raise imaplib.IMAP4.error(f"Could not mark email {uid} as read")
    finally:
        if logged_in:
            connection.logout()


def send_email_reply(
    recipient: str,
    subject: str,
    body: str,
    message_id: str | None,
    references_header: str | None,
) -> None:
    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")
    smtp_host = os.getenv("EMAIL_SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_SMTP_PORT", "465"))
    if not user or not password:
        raise ValueError("EMAIL_USER and EMAIL_PASSWORD must be configured")
    if not is_reply_address(recipient):
        raise ValueError("The reply address is invalid")

    reply = EmailMessage()
    reply["From"] = user
    reply["To"] = recipient
    reply["Subject"] = subject if subject.lower().startswith("re:") else f"Re: {subject}"

    valid_message_ids = re.findall(r"<[^<>\s]+>", references_header or "")
    if message_id and re.fullmatch(r"<[^<>\s]+>", message_id.strip()):
        valid_message_ids.append(message_id.strip())
        reply["In-Reply-To"] = message_id.strip()
    if valid_message_ids:
        reply["References"] = " ".join(dict.fromkeys(valid_message_ids))
    reply.set_content(body)

    with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ssl.create_default_context()) as connection:
        connection.login(user, password)
        connection.send_message(reply)