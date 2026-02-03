

from pydantic import BaseModel, Field, validator
from typing import Optional
from typing_extensions import Literal
from datetime import datetime, date
from bson import ObjectId

class AttendanceBase(BaseModel):
    employee_id: str = Field(..., min_length=1, description="Employee ID")
    date: str = Field(..., description="Attendance date in YYYY-MM-DD format")
    status: Literal["Present", "Absent"] = Field(..., description="Attendance status")

    @validator('date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class AttendanceStats(BaseModel):
    employee_id: str
    total_days: int
    present_days: int
    absent_days: int

