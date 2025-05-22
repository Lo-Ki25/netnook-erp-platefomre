from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "En cours"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = 0.0
    client_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None
    
class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Client schemas
class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = None
    
class Client(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "À faire"
    priority: Optional[str] = "Moyenne"
    due_date: Optional[datetime] = None
    project_id: int

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    title: Optional[str] = None
    project_id: Optional[int] = None
    
class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Invoice schemas
class InvoiceBase(BaseModel):
    invoice_number: str
    client_id: int
    amount: float
    status: Optional[str] = "En attente"
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(InvoiceBase):
    invoice_number: Optional[str] = None
    client_id: Optional[int] = None
    amount: Optional[float] = None
    
class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Transaction schemas
class TransactionBase(BaseModel):
    invoice_id: Optional[int] = None
    amount: float
    type: str  # Revenu, Dépense
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    amount: Optional[float] = None
    type: Optional[str] = None
    
class Transaction(TransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Event schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    all_day: Optional[bool] = False
    location: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    title: Optional[str] = None
    start_date: Optional[datetime] = None
    
class Event(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Document schemas
class DocumentBase(BaseModel):
    name: str
    file_path: str
    file_type: Optional[str] = None
    size: Optional[int] = None
    project_id: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    name: Optional[str] = None
    file_path: Optional[str] = None
    
class Document(DocumentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Resource schemas
class ResourceBase(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    availability: Optional[bool] = True

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(ResourceBase):
    name: Optional[str] = None
    type: Optional[str] = None
    
class Resource(ResourceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# InventoryItem schemas
class InventoryItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: Optional[int] = 0
    unit_price: Optional[float] = None
    category: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(InventoryItemBase):
    name: Optional[str] = None
    
class InventoryItem(InventoryItemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
