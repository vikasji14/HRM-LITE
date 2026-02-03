

import { useState, useEffect, useRef } from 'react';
import { employeeAPI, attendanceAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import EmployeeDetailView from './EmployeeDetailView';
import AttendanceForm from './AttendanceForm';

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedEmployees, setSelectedEmployees] = useState([]); // Multiple employees
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Today's date

  // Filter employees based on search term
  const filteredEmployeesForDropdown = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
        setIsEmployeeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle employee selection in filter
  const toggleEmployeeFilter = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees(prev => [...prev, employeeId]);
    }
  };

  // Select all filtered employees
  const selectAllEmployees = () => {
    const allFilteredIds = filteredEmployeesForDropdown.map(emp => emp.employee_id);
    const allSelected = allFilteredIds.every(id => selectedEmployees.includes(id));
    
    if (allSelected) {
      setSelectedEmployees(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedEmployees(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedEmployees]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees
      const empResponse = await employeeAPI.getAll();
      setEmployees(empResponse.data);

      // Fetch all attendance (for list view statistics)
      const params = {};
      // Note: Backend doesn't support multiple employee_id filter, so we'll filter on frontend
      
      const attResponse = await attendanceAPI.getAll(params);
      setAttendance(attResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Get attendance for a specific employee and date
  const getAttendanceForDate = (employeeId, date) => {
    return attendance.find(
      record => record.employee_id === employeeId && record.date === date
    );
  };

  // Calculate statistics for an employee (filtered by selected month)
  const getEmployeeStats = (employeeId) => {
    // Filter attendance by employee and selected month
    const empAttendance = attendance.filter(a => {
      if (a.employee_id !== employeeId) return false;
      // Check if the attendance date belongs to the selected month
      const recordMonth = a.date.slice(0, 7); // Get YYYY-MM format
      return recordMonth === selectedMonth;
    });
    const totalDays = empAttendance.length;
    const presentDays = empAttendance.filter(a => a.status === 'Present').length;
    const absentDays = empAttendance.filter(a => a.status === 'Absent').length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { totalDays, presentDays, absentDays, percentage };
  };

  // Get all dates in selected month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(date);
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = monthNames[month - 1];

  // Handle employee click to show detail
  const handleEmployeeClick = (employee) => {
    setDetailEmployee(employee);
    setViewMode('detail');
  };

  // Back to list view
  const handleBackToList = () => {
    setViewMode('list');
    setDetailEmployee(null);
    fetchData(); // Refresh data when going back
  };

  // Handle attendance marked successfully
  const handleAttendanceMarked = () => {
    setShowAttendanceModal(false);
    fetchData(); // Refresh data after marking attendance
  };
  // Fetch attendance for specific employee when viewing detail
  useEffect(() => {
    if (viewMode === 'detail' && detailEmployee) {
      const fetchEmployeeAttendance = async () => {
        try {
          const response = await attendanceAPI.getByEmployee(detailEmployee.employee_id);
          setAttendance(response.data);
        } catch (err) {
          console.error('Failed to fetch employee attendance:', err);
        }
      };
      fetchEmployeeAttendance();
    }
  }, [viewMode, detailEmployee, selectedMonth]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Detail View (Employee Calendar)
  if (viewMode === 'detail' && detailEmployee) {
    // Filter attendance for selected month
    const monthAttendance = attendance.filter(a => {
      const recordMonth = a.date.slice(0, 7);
      return recordMonth === selectedMonth;
    });

    return (
      <EmployeeDetailView
        employee={detailEmployee}
        attendance={monthAttendance}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onBack={handleBackToList}
      />
    );
  }

  // List View
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          Attendance Dashboard
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base"
          />
          {/* Employee Multi-Select Filter */}
          <div ref={employeeDropdownRef} className="relative w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search & Select Employees..."
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                onFocus={() => setIsEmployeeDropdownOpen(true)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full sm:w-64 text-sm sm:text-base"
              />
              <svg
                className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Selected Count */}
            {selectedEmployees.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployees([]);
                  setEmployeeSearchTerm('');
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear ({selectedEmployees.length} selected)
              </button>
            )}

            {/* Dropdown List */}
            {isEmployeeDropdownOpen && (
              <div className="absolute z-50 w-full sm:w-64 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {/* Select All Button */}
                {filteredEmployeesForDropdown.length > 0 && (
                  <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-2">
                    <button
                      type="button"
                      onClick={selectAllEmployees}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                    >
                      {filteredEmployeesForDropdown.every(emp => selectedEmployees.includes(emp.employee_id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                )}

                {/* Employee List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployeesForDropdown.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No employees found
                    </div>
                  ) : (
                    filteredEmployeesForDropdown.map((emp) => {
                      const isSelected = selectedEmployees.includes(emp.employee_id);
                      return (
                        <label
                          key={emp.employee_id}
                          className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEmployeeFilter(emp.employee_id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {emp.full_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.employee_id} • {emp.department}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Mark Attendance Button */}
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Mark Attendance</span>
            <span className="sm:hidden">Mark</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2 sm:p-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {selectedEmployees.length > 0 ? selectedEmployees.length : employees.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-full p-2 sm:p-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Present</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {attendance.filter(a => {
                  const recordMonth = a.date.slice(0, 7);
                  return recordMonth === selectedMonth && a.status === 'Present';
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 rounded-full p-2 sm:p-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Absent</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {attendance.filter(a => {
                  const recordMonth = a.date.slice(0, 7);
                  return recordMonth === selectedMonth && a.status === 'Absent';
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-full p-2 sm:p-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Attendance</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {(() => {
                  const monthAttendance = attendance.filter(a => {
                    const recordMonth = a.date.slice(0, 7);
                    return recordMonth === selectedMonth;
                  });
                  return monthAttendance.length > 0
                    ? Math.round(
                        (monthAttendance.filter(a => a.status === 'Present').length / monthAttendance.length) * 100
                      )
                    : 0;
                })()}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Monthly Status
          </h3>
        </div>
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3 p-4">
          {(selectedEmployees.length > 0 
            ? employees.filter(e => selectedEmployees.includes(e.employee_id))
            : employees
          ).map((employee) => {
            const stats = getEmployeeStats(employee.employee_id);
            return (
              <div
                key={employee.employee_id}
                onClick={() => handleEmployeeClick(employee)}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {employee.full_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {employee.employee_id}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmployeeClick(employee);
                    }}
                    className="text-blue-600 dark:text-blue-400 text-xs font-medium"
                  >
                    View →
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-white truncate ml-2 max-w-[60%]">
                      {employee.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Department:</span>
                    <span className="text-gray-900 dark:text-white">
                      {employee.department}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Present: </span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {stats.presentDays}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {stats.percentage}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${stats.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Employee ID
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Email
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Department
                </th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Present Count
                </th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Attendance %
                </th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(selectedEmployees.length > 0 
                ? employees.filter(e => selectedEmployees.includes(e.employee_id))
                : employees
              ).map((employee) => {
                const stats = getEmployeeStats(employee.employee_id);
                return (
                  <tr
                    key={employee.employee_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleEmployeeClick(employee)}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {employee.employee_id}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {employee.full_name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {employee.email}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {employee.department}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {stats.presentDays}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {stats.percentage}%
                        </span>
                        <div className="w-16 lg:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmployeeClick(employee);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        <span className="hidden lg:inline">View Details →</span>
                        <span className="lg:hidden">View →</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Mark Attendance
              </h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <AttendanceForm
                employees={employees}
                onSuccess={handleAttendanceMarked}
                onCancel={() => setShowAttendanceModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Daily Attendance Status Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Daily Attendance Status
            </h3>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Get attendance for selected date */}
        {(() => {
          const dateAttendance = attendance.filter(a => a.date === selectedDate);
          
          // Create a map of employee_id to attendance status
          const attendanceMap = {};
          dateAttendance.forEach(record => {
            attendanceMap[record.employee_id] = record.status;
          });

          // Get all employees and their status for the selected date
          const employeesWithStatus = employees.map(employee => {
            const status = attendanceMap[employee.employee_id] || 'Not Marked';
            return {
              ...employee,
              status
            };
          });

          // Filter employees if selectedEmployees filter is active
          const filteredEmployees = selectedEmployees.length > 0
            ? employeesWithStatus.filter(e => selectedEmployees.includes(e.employee_id))
            : employeesWithStatus;

          return (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Employee ID
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Department
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const statusColor = employee.status === 'Present' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                        : employee.status === 'Absent'
                        ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                      
                      return (
                        <tr
                          key={employee.employee_id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {employee.employee_id}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.full_name}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.email}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.department}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                              {employee.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default Dashboard;

