from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import InventoryItem
from app.schemas.schemas import InventoryItem as InventoryItemSchema, InventoryItemCreate, InventoryItemUpdate

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=InventoryItemSchema, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: InventoryItemCreate, db: Session = Depends(get_db)):
    db_item = InventoryItem(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[InventoryItemSchema])
def read_inventory_items(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_quantity: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem)
    
    if search:
        query = query.filter(InventoryItem.name.ilike(f"%{search}%"))
    if category:
        query = query.filter(InventoryItem.category == category)
    if min_quantity is not None:
        query = query.filter(InventoryItem.quantity >= min_quantity)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=InventoryItemSchema)
def read_inventory_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Article d'inventaire non trouvé")
    return db_item

@router.put("/{item_id}", response_model=InventoryItemSchema)
def update_inventory_item(item_id: int, item: InventoryItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Article d'inventaire non trouvé")
    
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Article d'inventaire non trouvé")
    
    db.delete(db_item)
    db.commit()
    return None
