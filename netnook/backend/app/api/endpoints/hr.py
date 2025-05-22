from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import Resource
from app.schemas.schemas import Resource as ResourceSchema, ResourceCreate, ResourceUpdate

router = APIRouter(
    prefix="/hr",
    tags=["hr"],
    responses={404: {"description": "Not found"}},
)

# Nous utilisons le modèle Resource pour les ressources humaines également
# avec le type "Humain" pour distinguer des autres types de ressources

@router.post("/employees", response_model=ResourceSchema, status_code=status.HTTP_201_CREATED)
def create_employee(employee: ResourceCreate, db: Session = Depends(get_db)):
    # Forcer le type à "Humain" pour les employés
    employee_data = employee.dict()
    employee_data["type"] = "Humain"
    
    db_employee = Resource(**employee_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("/employees", response_model=List[ResourceSchema])
def read_employees(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    availability: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Resource).filter(Resource.type == "Humain")
    
    if search:
        query = query.filter(Resource.name.ilike(f"%{search}%"))
    if availability is not None:
        query = query.filter(Resource.availability == availability)
        
    return query.offset(skip).limit(limit).all()

@router.get("/employees/{employee_id}", response_model=ResourceSchema)
def read_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(Resource).filter(
        Resource.id == employee_id,
        Resource.type == "Humain"
    ).first()
    
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return db_employee

@router.put("/employees/{employee_id}", response_model=ResourceSchema)
def update_employee(employee_id: int, employee: ResourceUpdate, db: Session = Depends(get_db)):
    db_employee = db.query(Resource).filter(
        Resource.id == employee_id,
        Resource.type == "Humain"
    ).first()
    
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    
    # Empêcher la modification du type pour garder "Humain"
    update_data = employee.dict(exclude_unset=True)
    if "type" in update_data:
        del update_data["type"]
    
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(Resource).filter(
        Resource.id == employee_id,
        Resource.type == "Humain"
    ).first()
    
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    
    db.delete(db_employee)
    db.commit()
    return None
