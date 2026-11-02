from sqlalchemy import BigInteger, Boolean, CheckConstraint, Column, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship

from database.postgreSQL import Base


class StoredEmail(Base):
    __tablename__ = "email"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    mail_for = Column("for", Text, nullable=False)
    email = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    reply_to = Column(Text, nullable=True)
    message_id = Column(Text, nullable=True)
    references_header = Column(Text, nullable=True)
    can_reply = Column(Boolean, nullable=False, default=False)
    received_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    replied_at = Column(DateTime(timezone=True), nullable=True)

    analysis = relationship(
        "EmailAnalysis",
        back_populates="stored_email",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class EmailAnalysis(Base):
    __tablename__ = "email_analysis"
    __table_args__ = (
        CheckConstraint(
            "urgency IN ('High', 'Medium', 'Low')",
            name="check_email_analysis_urgency",
        ),
    )

    email_id = Column(
        BigInteger,
        ForeignKey("email.id", ondelete="CASCADE"),
        primary_key=True,
    )
    summary = Column(Text, nullable=False)
    urgency = Column(Text, nullable=False)

    stored_email = relationship("StoredEmail", back_populates="analysis")