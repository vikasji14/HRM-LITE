"""
Vercel Serverless Function Entry Point
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import employee_routes, attendance_routes
from database.db import init_db

# Create FastAPI app without lifespan for Vercel (serverless doesn't support lifespan)
app = FastAPI(
    title="HRMS Lite API",
    description="Human Resource Management System API",
    version="1.0.0"
)

# Initialize database on startup (for serverless, we do it per request or use a different approach)
@app.on_event("startup")
async def startup_event():
    await init_db()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(employee_routes.router, prefix="/api/employees", tags=["employees"])
app.include_router(attendance_routes.router, prefix="/api/attendance", tags=["attendance"])

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "HRMS Lite API is running on Vercel"}

# Export handler for Vercel
handler = app

