from sqlalchemy import BigInteger, CheckConstraint, Column, ForeignKey, Text
from sqlalchemy.orm import relationship

from database.postgreSQL import Base


class StoredEmail(Base):
    __tablename__ = "email"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    mail_for = Column("for", Text, nullable=False)
    email = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=False)

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