from fastapi import APIRouter

from app.api.endpoints import projects, clients, tasks, finance, planning, documents, resources, inventory, analytics, hr

api_router = APIRouter()
api_router.include_router(projects.router)
api_router.include_router(clients.router)
api_router.include_router(tasks.router)
api_router.include_router(finance.router)
api_router.include_router(planning.router)
api_router.include_router(documents.router)
api_router.include_router(resources.router)
api_router.include_router(inventory.router)
api_router.include_router(analytics.router)
api_router.include_router(hr.router)
