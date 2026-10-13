import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Lê a URL de conexão do ficheiro .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Cria o motor de conexão
engine = create_engine(DATABASE_URL)

# Configura a sessão da base de dados
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para criar os modelos de dados
Base = declarative_base()

# Função utilitária para usar nas rotas do FastAPI (Injeção de Dependência)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()