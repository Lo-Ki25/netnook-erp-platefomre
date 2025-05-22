from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import Resource
from app.schemas.schemas import Resource as ResourceSchema, ResourceCreate, ResourceUpdate

router = APIRouter(
    prefix="/resources",
    tags=["resources"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=ResourceSchema, status_code=status.HTTP_201_CREATED)
def create_resource(resource: ResourceCreate, db: Session = Depends(get_db)):
    db_resource = Resource(**resource.dict())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.get("/", response_model=List[ResourceSchema])
def read_resources(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    type: Optional[str] = None,
    availability: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    
    if search:
        query = query.filter(Resource.name.ilike(f"%{search}%"))
    if type:
        query = query.filter(Resource.type == type)
    if availability is not None:
        query = query.filter(Resource.availability == availability)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{resource_id}", response_model=ResourceSchema)
def read_resource(resource_id: int, db: Session = Depends(get_db)):
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Ressource non trouvée")
    return db_resource

@router.put("/{resource_id}", response_model=ResourceSchema)
def update_resource(resource_id: int, resource: ResourceUpdate, db: Session = Depends(get_db)):
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Ressource non trouvée")
    
    update_data = resource.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_resource, key, value)
    
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Ressource non trouvée")
    
    db.delete(db_resource)
    db.commit()
    return None
