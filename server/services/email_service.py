from contextlib import closing
from typing import cast

from sqlalchemy.orm import Session

from database.email_repository import (
    get_recent_emails,
    store_email,
    store_llm_response,
)
from helpers.gmail_client import get_unseen_emails
from helpers.ollama_client import analyze_email


def fetch_and_store_unseen_emails(db: Session) -> list[dict[str, str]]:
    emails = []
    with closing(get_unseen_emails()) as unseen_emails:
        for email in unseen_emails:
            store_email(
                db,
                email.sender,
                email.subject,
                email.body,
                email.mailbox,
                email.reply_to,
                email.message_id,
                email.references_header,
                email.can_reply,
            )
            emails.append(
                {
                    "email": email.sender,
                    "title": email.subject,
                    "body": email.body,
                }
            )

    return emails


def analyze_and_store_emails(db: Session, limit: int) -> list[dict[str, object]]:
    results = []
    for stored_email in get_recent_emails(db, limit):
        analysis = stored_email.analysis
        if analysis is None:
            classification = analyze_email(stored_email.title, stored_email.body)
            store_llm_response(
                db,
                cast(int, stored_email.id),
                classification.summary,
                classification.urgency,
            )
            summary = classification.summary
            urgency = classification.urgency
        else:
            summary = analysis.summary
            urgency = analysis.urgency

        results.append(
            {
                "id": stored_email.id,
                "email": stored_email.email,
                "title": stored_email.title,
                "received_at": stored_email.received_at,
                "summary": summary,
                "urgency": urgency,
                "can_reply": stored_email.can_reply,
            }
        )
    return results
