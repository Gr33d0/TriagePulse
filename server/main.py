# Pydantic Uvicorn ollama
# uvicorn main:app --reload
import imaplib
import logging
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database.postgreSQL import SessionLocal, engine
from helpers.ollama_client import EmailAnalysisError
from services.email_service import (
    analyze_and_store_emails,
    fetch_and_store_unseen_emails,
)

app = FastAPI(title="TriagePulse API")
logger = logging.getLogger(__name__)


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
    summary: str
    urgency: Literal["High", "Medium", "Low"]


class AnalyzedEmailsResponse(BaseModel):
    emails: list[AnalyzedEmail]


@app.get("/")
async def home():
    return {"message": "Hello, world!"}


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

@app.get("/db_status")
def db_status() -> dict[str, bool]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"connected": True}
    except SQLAlchemyError:
        logger.exception("Database connectivity check failed")
        return {"connected": False}
