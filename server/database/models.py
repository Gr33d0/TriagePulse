from sqlalchemy import BigInteger, Column, Text

from database.postgreSQL import Base


class StoredEmail(Base):
    __tablename__ = "email"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    mail_for = Column("for", Text, nullable=False)
    email = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
