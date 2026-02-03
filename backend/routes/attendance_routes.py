
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from database.db import get_database
from models.attendance import AttendanceCreate, AttendanceResponse, AttendanceStats
from datetime import datetime

router = APIRouter()

def attendance_helper(attendance) -> dict:
    
    if attendance:
        attendance["id"] = str(attendance["_id"])
        attendance.pop("_id", None)
        return attendance
    return None

@router.get("/", response_model=List[AttendanceResponse])
async def get_all_attendance(
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)")
):

    try:
        db = get_database()
        attendance_collection = db.attendance
        
        # Build query filter
        query_filter = {}
        if employee_id:
            query_filter["employee_id"] = employee_id
        if date:
            query_filter["date"] = date
        
        # Fetch attendance records
        cursor = attendance_collection.find(query_filter).sort([("date", -1), ("created_at", -1)])
        attendance_records = await cursor.to_list(length=10000)
        
        # Convert ObjectId to string
        result = [attendance_helper(record) for record in attendance_records]
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendance records: {str(e)}"
        )

@router.get("/employee/{employee_id}", response_model=List[AttendanceResponse])
async def get_employee_attendance(employee_id: str):

    try:
        db = get_database()
        employees_collection = db.employees
        attendance_collection = db.attendance
        
        # Verify employee exists
        employee = await employees_collection.find_one({"employee_id": employee_id})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Fetch attendance records for this employee
        cursor = attendance_collection.find({"employee_id": employee_id}).sort("date", -1)
        attendance_records = await cursor.to_list(length=10000)
        
        # Convert ObjectId to string
        result = [attendance_helper(record) for record in attendance_records]
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendance records: {str(e)}"
        )

@router.get("/stats/{employee_id}", response_model=AttendanceStats)
async def get_attendance_stats(employee_id: str):
  
    try:
        db = get_database()
        employees_collection = db.employees
        attendance_collection = db.attendance
        
        # Verify employee exists
        employee = await employees_collection.find_one({"employee_id": employee_id})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Count total days
        total_days = await attendance_collection.count_documents({"employee_id": employee_id})
        
        # Count present days
        present_days = await attendance_collection.count_documents({
            "employee_id": employee_id,
            "status": "Present"
        })
        
        # Count absent days
        absent_days = await attendance_collection.count_documents({
            "employee_id": employee_id,
            "status": "Absent"
        })
        
        return AttendanceStats(
            employee_id=employee_id,
            total_days=total_days,
            present_days=present_days,
            absent_days=absent_days
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendance statistics: {str(e)}"
        )

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def mark_attendance(attendance: AttendanceCreate):
  
    try:
        db = get_database()
        employees_collection = db.employees
        attendance_collection = db.attendance
        
        # Verify employee exists
        employee = await employees_collection.find_one({"employee_id": attendance.employee_id})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Check if attendance already exists for this date
        existing = await attendance_collection.find_one({
            "employee_id": attendance.employee_id,
            "date": attendance.date
        })
        
        if existing:
            # Update existing attendance
            attendance_dict = attendance.dict()
            attendance_dict["created_at"] = datetime.utcnow()
            
            await attendance_collection.update_one(
                {"employee_id": attendance.employee_id, "date": attendance.date},
                {"$set": attendance_dict}
            )
            
            # Fetch and return updated record
            updated = await attendance_collection.find_one({
                "employee_id": attendance.employee_id,
                "date": attendance.date
            })
            return attendance_helper(updated)
        
        # Create new attendance record
        attendance_dict = attendance.dict()
        attendance_dict["created_at"] = datetime.utcnow()
        
        result = await attendance_collection.insert_one(attendance_dict)
        
        # Fetch and return the created attendance record
        new_attendance = await attendance_collection.find_one({"_id": result.inserted_id})
        return attendance_helper(new_attendance)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark attendance: {str(e)}"
        )

