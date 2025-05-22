from alembic import command
from alembic.config import Config
from app.db.database import Base, engine
from app.models import models
import os
import logging

logger = logging.getLogger(__name__)

def init_db():
    """Initialise la base de données et crée les tables si elles n'existent pas."""
    try:
        # Créer les tables
        Base.metadata.create_all(bind=engine)
        logger.info("Base de données initialisée avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation de la base de données: {e}")
        raise
