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
from mangum import Mangum

# Create FastAPI app without lifespan for Vercel (serverless doesn't support lifespan properly)
app = FastAPI(
    title="HRMS Lite API",
    description="Human Resource Management System API",
    version="1.0.0"
)

# Initialize database - will be called on first request
# For serverless, we initialize per request or use connection pooling
@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
    except Exception as e:
        print(f"Database initialization warning: {e}")

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

# Create Mangum handler
mangum_app = Mangum(app, lifespan="off")

# Export handler as function for Vercel
def handler(event, context):
    """
    Vercel serverless function handler
    Wraps FastAPI ASGI app using Mangum
    """
    return mangum_app(event, context)

