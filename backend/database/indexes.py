
async def create_indexes(database):
   
    try:
        # Employees collection indexes
        employees_collection = database.employees
        await employees_collection.create_index("employee_id", unique=True)
        await employees_collection.create_index("email", unique=True)
        await employees_collection.create_index("created_at")
        
        # Attendance collection indexes
        attendance_collection = database.attendance
        await attendance_collection.create_index([("employee_id", 1), ("date", 1)], unique=True)
        await attendance_collection.create_index("employee_id")
        await attendance_collection.create_index("date")
        await attendance_collection.create_index("created_at")
        
        print("Database indexes created successfully")
        
    except Exception as e:
        print(f"⚠️  Warning: Error creating indexes: {e}")

