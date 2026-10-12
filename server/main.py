# Pydantic Uvicorn ollama
# uvicorn main:app
from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
import imaplib

from helpers.gmail_client import get_unseen_emails

app = FastAPI(title="TriagePulse API")


class EmailMessage(BaseModel):
    email: str
    titulo: str
    assunto: str


class EmailsResponse(BaseModel):
    emails: list[EmailMessage]


@app.get("/")
async def home():
    return {"message": "Hello, world!"}


@app.get("/get_emails", response_model=EmailsResponse)
def get_emails() -> EmailsResponse:
    try:
        return EmailsResponse(emails=get_unseen_emails())
    except ValueError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except (imaplib.IMAP4.error, OSError) as error:
        raise HTTPException(status_code=502, detail="Could not retrieve emails from Gmail") from error