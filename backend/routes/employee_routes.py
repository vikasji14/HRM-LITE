

from fastapi import APIRouter, HTTPException, status
from typing import List
from database.db import get_database
from models.employee import EmployeeCreate, EmployeeResponse
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def employee_helper(employee) -> dict:
    
    if employee:
        employee["id"] = str(employee["_id"])
        employee.pop("_id", None)
        return employee
    return None

@router.get("/", response_model=List[EmployeeResponse])
async def get_all_employees():

    try:
        db = get_database()
        employees_collection = db.employees
        
        # Fetch all employees and sort by created_at descending
        cursor = employees_collection.find().sort("created_at", -1)
        employees = await cursor.to_list(length=1000)
        
        # Convert ObjectId to string
        result = [employee_helper(emp) for emp in employees]
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employees: {str(e)}"
        )

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str):

    try:
        db = get_database()
        employees_collection = db.employees
        
        employee = await employees_collection.find_one({"employee_id": employee_id})
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        return employee_helper(employee)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employee: {str(e)}"
        )

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(employee: EmployeeCreate):

    try:
        db = get_database()
        employees_collection = db.employees
        
        # Check if employee_id already exists
        existing_employee = await employees_collection.find_one(
            {"employee_id": employee.employee_id}
        )
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee ID '{employee.employee_id}' is already registered. Please use a different Employee ID."
            )
        
        # Check if email already exists
        existing_email = await employees_collection.find_one(
            {"email": employee.email}
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{employee.email}' is already registered. Please use a different email address."
            )
        
        # Create employee document
        employee_dict = employee.dict()
        employee_dict["created_at"] = datetime.utcnow()
        
        # Insert employee
        result = await employees_collection.insert_one(employee_dict)
        
        # Fetch and return the created employee
        new_employee = await employees_collection.find_one(
            {"_id": result.inserted_id}
        )
        
        return employee_helper(new_employee)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}"
        )

@router.delete("/{employee_id}", status_code=status.HTTP_200_OK)
async def delete_employee(employee_id: str):

    try:
        db = get_database()
        employees_collection = db.employees
        attendance_collection = db.attendance
        
        # Check if employee exists
        employee = await employees_collection.find_one({"employee_id": employee_id})
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Delete employee
        await employees_collection.delete_one({"employee_id": employee_id})
        
        # Delete all attendance records for this employee
        await attendance_collection.delete_many({"employee_id": employee_id})
        
        return {"message": "Employee deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete employee: {str(e)}"
        )

