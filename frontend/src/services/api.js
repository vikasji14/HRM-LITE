

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


export const employeeAPI = {
  // Get all employees
  getAll: () => api.get('/employees'),
  
  // Get employee by ID
  getById: (employeeId) => api.get(`/employees/${employeeId}`),
  
  // Create new employee
  create: (employeeData) => api.post('/employees', employeeData),
  
  // Delete employee
  delete: (employeeId) => api.delete(`/employees/${employeeId}`)
};


export const attendanceAPI = {
  // Get all attendance records (optional filters)
  getAll: (params = {}) => api.get('/attendance', { params }),
  
  // Get attendance for specific employee
  getByEmployee: (employeeId) => api.get(`/attendance/employee/${employeeId}`),
  
  // Get attendance statistics for employee
  getStats: (employeeId) => api.get(`/attendance/stats/${employeeId}`),
  
  // Mark attendance
  mark: (attendanceData) => api.post('/attendance', attendanceData)
};

export default api;

