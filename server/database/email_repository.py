from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database.models import EmailAnalysis, StoredEmail


def get_recent_emails(db: Session, limit: int) -> list[StoredEmail]:
    return (
        db.query(StoredEmail)
        .order_by(StoredEmail.id.desc())
        .limit(limit)
        .all()
    )


def store_email(
    db: Session,
    sender: str,
    subject: str,
    body: str,
    mailbox: str,
) -> None:
    stored_email = StoredEmail(
        mail_for=mailbox,
        email=sender,
        title=subject,
        body=body,
    )
    db.add(stored_email)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

def store_llm_response(
    db: Session,
    email_id: int,
    summary: str,
    urgency: str,
) -> None:
    if db.get(StoredEmail, email_id) is None:
        raise ValueError(f"Email with ID {email_id} not found")

    email_analysis = db.get(EmailAnalysis, email_id)
    if email_analysis is None:
        email_analysis = EmailAnalysis(
            email_id=email_id,
            summary=summary,
            urgency=urgency,
        )
        db.add(email_analysis)
    else:
        email_analysis.summary = summary
        email_analysis.urgency = urgency

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise