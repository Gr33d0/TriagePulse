# Pydantic Uvicorn ollama
# uvicorn main:app --reload
import imaplib
import logging
import smtplib
from contextlib import asynccontextmanager
from datetime import datetime, time, timedelta, timezone
from typing import AsyncGenerator, Literal

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from starlette.concurrency import run_in_threadpool

from database.postgreSQL import SessionLocal
from database.models import EmailAnalysis, StoredEmail
from helpers.gmail_client import is_reply_address, send_email_reply
from helpers.ollama_client import EmailAnalysisError, suggest_email_reply
from services.connection_checks import check_connections, check_database_connection
from services.email_service import (
    analyze_and_store_emails,
    fetch_and_store_unseen_emails,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Checking external service connections...")
    connections = await run_in_threadpool(check_connections)
    for service, connected in connections.items():
        status = "connected" if connected else "not connected"
        logger.info("%s: %s", service.capitalize(), status)
    yield


app = FastAPI(title="TriagePulse API", lifespan=lifespan)


class EmailMessage(BaseModel):
    email: str
    title: str
    body: str


class EmailsResponse(BaseModel):
    emails: list[EmailMessage]


class AnalyzedEmail(BaseModel):
    id: int
    email: str
    title: str
    received_at: datetime
    summary: str
    urgency: Literal["High", "Medium", "Low"]
    can_reply: bool


class AnalyzedEmailsResponse(BaseModel):
    emails: list[AnalyzedEmail]


class ReplyRequest(BaseModel):
    body: str = Field(min_length=1, max_length=10000)


class ReplySuggestionRequest(BaseModel):
    style_example: str | None = Field(default=None, max_length=10000)


class DashboardResponse(BaseModel):
    total_emails: int
    urgent_emails: int
    awaiting_reply: int
    replies_sent: int
    volume: list[dict[str, int | str]]
    recent_emails: list[dict[str, int | str | None]]


@app.get("/")
async def home():
    return {"message": "Hello, world!"}


@app.post("/emails/{email_id}/suggest-reply")
def suggest_reply_to_email(
    email_id: int,
    request: ReplySuggestionRequest,
) -> dict[str, str]:
    db = SessionLocal()
    try:
        stored_email = db.get(StoredEmail, email_id)
        if stored_email is None:
            raise HTTPException(status_code=404, detail="Email not found")
        if (
            not stored_email.can_reply
            or not stored_email.reply_to
            or not is_reply_address(stored_email.email)
            or not is_reply_address(stored_email.reply_to)
        ):
            raise HTTPException(status_code=409, detail="This email cannot be replied to")

        try:
            suggestion = suggest_email_reply(
                stored_email.title,
                stored_email.body,
                request.style_example,
            )
        except EmailAnalysisError as error:
            logger.exception("Could not draft email reply")
            raise HTTPException(status_code=503, detail=str(error)) from error
        return {"suggestion": suggestion}
    except SQLAlchemyError as error:
        logger.exception("Could not retrieve email for reply suggestion")
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve email for reply suggestion",
        ) from error
    finally:
        db.close()


@app.get("/get_emails", response_model=EmailsResponse)
def get_emails() -> EmailsResponse:
    db = SessionLocal()
    try:
        return EmailsResponse(emails=fetch_and_store_unseen_emails(db))
    except ValueError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except (imaplib.IMAP4.error, OSError) as error:
        raise HTTPException(status_code=502, detail="Could not retrieve emails from Gmail") from error
    except SQLAlchemyError as error:
        logger.exception("Could not save emails to the database")
        raise HTTPException(status_code=503, detail="Could not save emails to the database") from error
    finally:
        db.close()


@app.get("/analyze_emails", response_model=AnalyzedEmailsResponse)
def analyze_stored_emails(
    limit: int = Query(default=50, ge=1, le=500),
) -> AnalyzedEmailsResponse:
    db = SessionLocal()
    try:
        return AnalyzedEmailsResponse(
            emails=analyze_and_store_emails(db, limit)
        )
    except EmailAnalysisError as error:
        logger.exception("Could not analyze stored emails")
        raise HTTPException(status_code=503, detail=str(error)) from error
    except SQLAlchemyError as error:
        logger.exception("Could not retrieve or save email analyses")
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve or save email analyses",
        ) from error
    finally:
        db.close()


@app.post("/emails/{email_id}/reply")
def reply_to_email(email_id: int, reply: ReplyRequest) -> dict[str, bool]:
    body = reply.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Reply body cannot be empty")

    db = SessionLocal()
    try:
        stored_email = db.get(StoredEmail, email_id)
        if stored_email is None:
            raise HTTPException(status_code=404, detail="Email not found")
        if (
            not stored_email.can_reply
            or not stored_email.reply_to
            or not is_reply_address(stored_email.email)
            or not is_reply_address(stored_email.reply_to)
        ):
            raise HTTPException(status_code=409, detail="This email cannot be replied to")

        try:
            send_email_reply(
                stored_email.reply_to,
                stored_email.title,
                body,
                stored_email.message_id,
                stored_email.references_header,
            )
        except ValueError as error:
            logger.exception("Email reply configuration is invalid")
            raise HTTPException(status_code=500, detail="Email sending is not configured correctly") from error
        except (smtplib.SMTPException, OSError) as error:
            logger.exception("Could not send email reply")
            raise HTTPException(status_code=502, detail="Could not send email reply") from error
        stored_email.replied_at = datetime.now(timezone.utc)
        try:
            db.commit()
        except SQLAlchemyError as error:
            db.rollback()
            logger.exception("Reply was sent but its status could not be saved")
            raise HTTPException(
                status_code=503,
                detail="Reply was sent, but its status could not be saved",
            ) from error
        return {"sent": True}
    finally:
        db.close()


@app.get("/dashboard_metrics", response_model=DashboardResponse)
def dashboard_metrics() -> DashboardResponse:
    db = SessionLocal()
    try:
        total_emails = db.query(func.count(StoredEmail.id)).scalar() or 0
        urgent_emails = (
            db.query(func.count(EmailAnalysis.email_id))
            .filter(EmailAnalysis.urgency == "High")
            .scalar()
            or 0
        )
        awaiting_reply = (
            db.query(func.count(StoredEmail.id))
            .filter(StoredEmail.can_reply.is_(True), StoredEmail.replied_at.is_(None))
            .scalar()
            or 0
        )
        replies_sent = (
            db.query(func.count(StoredEmail.id))
            .filter(StoredEmail.replied_at.is_not(None))
            .scalar()
            or 0
        )

        today = datetime.now(timezone.utc).date()
        first_day = today - timedelta(days=6)
        start = datetime.combine(first_day, time.min, tzinfo=timezone.utc)
        daily_counts = {
            str(day): count
            for day, count in db.query(
                func.date(StoredEmail.received_at),
                func.count(StoredEmail.id),
            )
            .filter(StoredEmail.received_at >= start)
            .group_by(func.date(StoredEmail.received_at))
            .all()
        }
        volume = [
            {
                "date": (first_day + timedelta(days=offset)).isoformat(),
                "count": daily_counts.get((first_day + timedelta(days=offset)).isoformat(), 0),
            }
            for offset in range(7)
        ]

        recent_rows = (
            db.query(StoredEmail, EmailAnalysis)
            .outerjoin(EmailAnalysis, EmailAnalysis.email_id == StoredEmail.id)
            .order_by(StoredEmail.received_at.desc(), StoredEmail.id.desc())
            .limit(5)
            .all()
        )
        recent_emails = [
            {
                "id": stored_email.id,
                "email": stored_email.email,
                "title": stored_email.title,
                "urgency": analysis.urgency if analysis else None,
            }
            for stored_email, analysis in recent_rows
        ]
        return DashboardResponse(
            total_emails=total_emails,
            urgent_emails=urgent_emails,
            awaiting_reply=awaiting_reply,
            replies_sent=replies_sent,
            volume=volume,
            recent_emails=recent_emails,
        )
    except SQLAlchemyError as error:
        logger.exception("Could not load dashboard metrics")
        raise HTTPException(status_code=503, detail="Could not load dashboard metrics") from error
    finally:
        db.close()


@app.get("/db_status")
def db_status() -> dict[str, bool]:
    return {"connected": check_database_connection()}
