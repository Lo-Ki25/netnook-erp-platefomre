from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.models.models import Project, Client, Task, Invoice, Transaction
from sqlalchemy import func, desc
import json

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    """Récupère les données pour le dashboard principal"""
    
    # Nombre total de projets par statut
    projects_by_status = db.query(
        Project.status, 
        func.count(Project.id).label("count")
    ).group_by(Project.status).all()
    
    # Nombre total de clients
    total_clients = db.query(func.count(Client.id)).scalar()
    
    # Nombre total de tâches par statut
    tasks_by_status = db.query(
        Task.status, 
        func.count(Task.id).label("count")
    ).group_by(Task.status).all()
    
    # Montant total des factures par statut
    invoices_by_status = db.query(
        Invoice.status, 
        func.sum(Invoice.amount).label("total")
    ).group_by(Invoice.status).all()
    
    # Transactions récentes
    recent_transactions = db.query(Transaction).order_by(desc(Transaction.date)).limit(5).all()
    
    # Projets récents
    recent_projects = db.query(Project).order_by(desc(Project.created_at)).limit(5).all()
    
    return {
        "projects_by_status": [{"status": status, "count": count} for status, count in projects_by_status],
        "total_clients": total_clients,
        "tasks_by_status": [{"status": status, "count": count} for status, count in tasks_by_status],
        "invoices_by_status": [{"status": status, "total": float(total) if total else 0} for status, total in invoices_by_status],
        "recent_transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "date": t.date.isoformat() if t.date else None,
                "description": t.description
            } 
            for t in recent_transactions
        ],
        "recent_projects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "created_at": p.created_at.isoformat()
            } 
            for p in recent_projects
        ]
    }

@router.get("/finance/summary")
def get_finance_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Récupère un résumé des données financières"""
    
    query = db.query(Transaction)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    transactions = query.all()
    
    # Calculer les revenus et dépenses
    income = sum(t.amount for t in transactions if t.type == "Revenu")
    expenses = sum(t.amount for t in transactions if t.type == "Dépense")
    
    # Transactions par catégorie
    categories = {}
    for t in transactions:
        if t.category:
            if t.category not in categories:
                categories[t.category] = {"income": 0, "expenses": 0}
            
            if t.type == "Revenu":
                categories[t.category]["income"] += t.amount
            elif t.type == "Dépense":
                categories[t.category]["expenses"] += t.amount
    
    return {
        "total_income": income,
        "total_expenses": expenses,
        "net_profit": income - expenses,
        "categories": [
            {
                "name": category,
                "income": data["income"],
                "expenses": data["expenses"],
                "balance": data["income"] - data["expenses"]
            }
            for category, data in categories.items()
        ]
    }

@router.get("/projects/performance")
def get_projects_performance(db: Session = Depends(get_db)):
    """Récupère les données de performance des projets"""
    
    projects = db.query(Project).all()
    
    project_data = []
    for project in projects:
        # Calculer le nombre de tâches par statut pour ce projet
        tasks_by_status = db.query(
            Task.status, 
            func.count(Task.id).label("count")
        ).filter(Task.project_id == project.id).group_by(Task.status).all()
        
        # Calculer le montant total des factures liées à ce client/projet
        total_invoiced = 0
        if project.client_id:
            total_invoiced = db.query(func.sum(Invoice.amount)).filter(
                Invoice.client_id == project.client_id
            ).scalar() or 0
        
        project_data.append({
            "id": project.id,
            "name": project.name,
            "status": project.status,
            "budget": project.budget,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "tasks": [{"status": status, "count": count} for status, count in tasks_by_status],
            "total_invoiced": float(total_invoiced)
        })
    
    return project_data

@router.get("/ai-insights")
def get_ai_insights(db: Session = Depends(get_db)):
    """Génère des insights basés sur les données de l'application"""
    
    # Nombre de projets en retard (date de fin dépassée mais statut pas terminé)
    from datetime import datetime
    now = datetime.utcnow()
    
    late_projects = db.query(func.count(Project.id)).filter(
        Project.end_date < now,
        Project.status != "Terminé"
    ).scalar() or 0
    
    # Taux de complétion des tâches
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.status == "Terminée"
    ).scalar() or 0
    
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Factures impayées
    unpaid_invoices = db.query(func.count(Invoice.id)).filter(
        Invoice.status == "En attente"
    ).scalar() or 0
    
    unpaid_amount = db.query(func.sum(Invoice.amount)).filter(
        Invoice.status == "En attente"
    ).scalar() or 0
    
    # Clients les plus actifs (avec le plus de projets)
    top_clients = db.query(
        Client.id,
        Client.name,
        func.count(Project.id).label("project_count")
    ).join(Project, Client.id == Project.client_id).group_by(
        Client.id, Client.name
    ).order_by(desc("project_count")).limit(5).all()
    
    return {
        "late_projects": late_projects,
        "task_completion_rate": task_completion_rate,
        "unpaid_invoices": {
            "count": unpaid_invoices,
            "total_amount": float(unpaid_amount)
        },
        "top_clients": [
            {
                "id": client_id,
                "name": name,
                "project_count": count
            }
            for client_id, name, count in top_clients
        ],
        "recommendations": [
            {
                "type": "alert",
                "message": f"Vous avez {late_projects} projets en retard qui nécessitent votre attention.",
                "priority": "high" if late_projects > 0 else "low"
            },
            {
                "type": "insight",
                "message": f"Votre taux de complétion des tâches est de {task_completion_rate:.1f}%.",
                "priority": "medium"
            },
            {
                "type": "action",
                "message": f"Vous avez {unpaid_invoices} factures impayées totalisant {float(unpaid_amount):.2f}€.",
                "priority": "high" if unpaid_invoices > 0 else "low"
            }
        ]
    }
