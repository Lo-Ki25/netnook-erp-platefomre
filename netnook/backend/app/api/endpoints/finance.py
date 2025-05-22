from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import Invoice, Transaction
from app.schemas.schemas import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate
from app.schemas.schemas import Transaction as TransactionSchema, TransactionCreate, TransactionUpdate

router = APIRouter(
    prefix="/finance",
    tags=["finance"],
    responses={404: {"description": "Not found"}},
)

# Endpoints pour les factures (invoices)
@router.post("/invoices", response_model=InvoiceSchema, status_code=status.HTTP_201_CREATED)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    db_invoice = Invoice(**invoice.dict())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/invoices", response_model=List[InvoiceSchema])
def read_invoices(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Invoice)
    
    if search:
        query = query.filter(Invoice.invoice_number.ilike(f"%{search}%"))
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if status:
        query = query.filter(Invoice.status == status)
        
    return query.offset(skip).limit(limit).all()

@router.get("/invoices/{invoice_id}", response_model=InvoiceSchema)
def read_invoice(invoice_id: int, db: Session = Depends(get_db)):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return db_invoice

@router.put("/invoices/{invoice_id}", response_model=InvoiceSchema)
def update_invoice(invoice_id: int, invoice: InvoiceUpdate, db: Session = Depends(get_db)):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    update_data = invoice.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_invoice, key, value)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    db.delete(db_invoice)
    db.commit()
    return None

# Endpoints pour les transactions
@router.post("/transactions", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/transactions", response_model=List[TransactionSchema])
def read_transactions(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    invoice_id: Optional[int] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    if invoice_id:
        query = query.filter(Transaction.invoice_id == invoice_id)
    if type:
        query = query.filter(Transaction.type == type)
    if category:
        query = query.filter(Transaction.category == category)
        
    return query.offset(skip).limit(limit).all()

@router.get("/transactions/{transaction_id}", response_model=TransactionSchema)
def read_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    return db_transaction

@router.put("/transactions/{transaction_id}", response_model=TransactionSchema)
def update_transaction(transaction_id: int, transaction: TransactionUpdate, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    update_data = transaction.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    db.delete(db_transaction)
    db.commit()
    return None
