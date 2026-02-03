# HRMS Lite - Human Resource Management System

A lightweight, full-stack Human Resource Management System built with React and FASTAPI. This application allows administrators to manage employee records and track daily attendance.

## 🚀 Features

### Employee Management
- ✅ Add new employees with unique Employee ID, Full Name, Email, and Department
- ✅ View list of all employees in a clean table format
- ✅ Delete employees (with confirmation)
- ✅ Server-side validation for required fields and email format
- ✅ Duplicate employee ID and email handling

### Attendance Management
- ✅ Mark attendance for employees (Present/Absent)
- ✅ View attendance records with filtering options
- ✅ Filter by employee and/or date
- ✅ Update existing attendance records for the same date
- ✅ Display attendance statistics (bonus feature)

### UI/UX Features
- ✅ **Dark/Light Mode Toggle** - Switch between themes with persistent preference
- ✅ Responsive design - Works on desktop and mobile devices
- ✅ Loading states for async operations
- ✅ Error handling with user-friendly messages
- ✅ Empty states for better UX
- ✅ Clean, modern, and professional interface

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

### Backend
- **Python 3.9+** - Programming language
- **FastAPI** - Modern, fast web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
