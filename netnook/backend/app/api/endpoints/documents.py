from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import Document
from app.schemas.schemas import Document as DocumentSchema, DocumentCreate, DocumentUpdate
import os
import shutil
from datetime import datetime

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIRECTORY = "/app/uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/", response_model=DocumentSchema, status_code=status.HTTP_201_CREATED)
async def create_document(
    file: UploadFile = File(...),
    project_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Créer un nom de fichier unique
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
    
    # Sauvegarder le fichier
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Créer l'entrée dans la base de données
    db_document = Document(
        name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        size=os.path.getsize(file_path),
        project_id=project_id
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.get("/", response_model=List[DocumentSchema])
def read_documents(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    
    if search:
        query = query.filter(Document.name.ilike(f"%{search}%"))
    if project_id:
        query = query.filter(Document.project_id == project_id)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{document_id}", response_model=DocumentSchema)
def read_document(document_id: int, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return db_document

@router.put("/{document_id}", response_model=DocumentSchema)
def update_document(document_id: int, document: DocumentUpdate, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    update_data = document.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_document, key, value)
    
    db.commit()
    db.refresh(db_document)
    return db_document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    # Supprimer le fichier physique
    try:
        if os.path.exists(db_document.file_path):
            os.remove(db_document.file_path)
    except Exception as e:
        # Log l'erreur mais continuer la suppression de l'entrée en base
        print(f"Erreur lors de la suppression du fichier: {e}")
    
    # Supprimer l'entrée en base
    db.delete(db_document)
    db.commit()
    return None
