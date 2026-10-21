from contextlib import closing

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
        analysis = analyze_email(stored_email.title, stored_email.body)
        store_llm_response(
            db,
            stored_email.id,
            analysis.summary,
            analysis.urgency,
        )
        results.append(
            {
                "id": stored_email.id,
                "email": stored_email.email,
                "title": stored_email.title,
                "summary": analysis.summary,
                "urgency": analysis.urgency,
            }
        )
    return results
