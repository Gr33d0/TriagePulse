# Pydantic Uvicorn ollama
# uvicorn main:app --reload
import imaplib
import logging

from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database.models import StoredEmail
from database.postgreSQL import SessionLocal, engine
from helpers.gmail_client import get_unseen_emails

app = FastAPI(title="TriagePulse API")
logger = logging.getLogger(__name__)


class EmailMessage(BaseModel):
    email: str
    title: str
    body: str


class EmailsResponse(BaseModel):
    emails: list[EmailMessage]


@app.get("/")
async def home():
    return {"message": "Hello, world!"}


@app.get("/get_emails", response_model=EmailsResponse)
def get_emails() -> EmailsResponse:
    db = SessionLocal()
    try:
        def save_email(
            email: dict[str, str],
            mailbox: str,
        ) -> None:
            stored_email = StoredEmail(
                mail_for=mailbox,
                email=email["email"],
                title=email["title"],
                body=email["body"],
            )
            db.add(stored_email)
            try:
                db.commit()
            except SQLAlchemyError:
                db.rollback()
                raise

        return EmailsResponse(emails=get_unseen_emails(save_email))
    except ValueError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except (imaplib.IMAP4.error, OSError) as error:
        raise HTTPException(status_code=502, detail="Could not retrieve emails from Gmail") from error
    except SQLAlchemyError as error:
        logger.exception("Could not save emails to the database")
        raise HTTPException(status_code=503, detail="Could not save emails to the database") from error
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
