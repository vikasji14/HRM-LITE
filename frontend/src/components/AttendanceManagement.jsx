

import { useState, useEffect } from 'react';
import { attendanceAPI, employeeAPI } from '../services/api';
import AttendanceForm from './AttendanceForm';
import AttendanceList from './AttendanceList';
import EmployeeAttendanceView from './EmployeeAttendanceView';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

function AttendanceManagement() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'employee'
  const [employeeStats, setEmployeeStats] = useState({});

  // Fetch all employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  // Fetch attendance records
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedEmployee) params.employee_id = selectedEmployee;
      if (filterDate) params.date = filterDate;
      
      const response = await attendanceAPI.getAll(params);
      setAttendance(response.data);
      
      // Fetch stats for all employees if in employee view
      if (viewMode === 'employee' && !selectedEmployee) {
        await fetchAllEmployeeStats();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance statistics for all employees
  const fetchAllEmployeeStats = async () => {
    const stats = {};
    for (const emp of employees) {
      try {
        const response = await attendanceAPI.getStats(emp.employee_id);
        stats[emp.employee_id] = response.data;
      } catch (err) {
        console.error(`Failed to fetch stats for ${emp.employee_id}:`, err);
      }
    }
    setEmployeeStats(stats);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedEmployee, filterDate, viewMode]);

  // Handle attendance creation
  const handleAttendanceMarked = () => {
    setShowForm(false);
    fetchAttendance();
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee ? employee.full_name : employeeId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Attendance Management
        </h2>
        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'employee'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Employee View
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {showForm ? 'Cancel' : '+ Mark Attendance'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.employee_id} - {emp.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        {(selectedEmployee || filterDate) && (
          <button
            onClick={() => {
              setSelectedEmployee('');
              setFilterDate('');
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Attendance Form */}
      {showForm && (
        <AttendanceForm
          employees={employees}
          onSuccess={handleAttendanceMarked}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Attendance List or Employee View */}
      {loading ? (
        <LoadingSpinner />
      ) : viewMode === 'employee' ? (
        <EmployeeAttendanceView
          employees={employees}
          attendance={attendance}
          employeeStats={employeeStats}
          selectedEmployee={selectedEmployee}
          onEmployeeSelect={setSelectedEmployee}
        />
      ) : (
        <AttendanceList
          attendance={attendance}
          getEmployeeName={getEmployeeName}
        />
      )}
    </div>
  );
}

export default AttendanceManagement;

