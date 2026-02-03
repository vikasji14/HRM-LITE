

import { useState, useRef, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import ErrorMessage from './ErrorMessage';

function AttendanceForm({ employees, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    employee_ids: [], // Multiple employees
    date: new Date().toISOString().split('T')[0], // Today's date
    status: 'Present'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle employee selection
  const toggleEmployee = (employeeId) => {
    if (formData.employee_ids.includes(employeeId)) {
      setFormData(prev => ({
        ...prev,
        employee_ids: prev.employee_ids.filter(id => id !== employeeId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employee_ids: [...prev.employee_ids, employeeId]
      }));
    }
    if (errors.employee_ids) {
      setErrors(prev => ({ ...prev, employee_ids: '' }));
    }
  };

  // Select all filtered employees
  const selectAll = () => {
    const allFilteredIds = filteredEmployees.map(emp => emp.employee_id);
    const allSelected = allFilteredIds.every(id => formData.employee_ids.includes(id));
    
    if (allSelected) {
      // Deselect all filtered
      setFormData(prev => ({
        ...prev,
        employee_ids: prev.employee_ids.filter(id => !allFilteredIds.includes(id))
      }));
    } else {
      // Select all filtered
      setFormData(prev => ({
        ...prev,
        employee_ids: [...new Set([...prev.employee_ids, ...allFilteredIds])]
      }));
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.employee_ids || formData.employee_ids.length === 0) {
      newErrors.employee_ids = 'Please select at least one employee';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Mark attendance for all selected employees
      const promises = formData.employee_ids.map(employee_id =>
        attendanceAPI.mark({
          employee_id,
          date: formData.date,
          status: formData.status
        })
      );
      
      await Promise.all(promises);
      
      // Reset form
      setFormData({
        employee_ids: [],
        date: new Date().toISOString().split('T')[0],
        status: 'Present'
      });
      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to mark attendance';
      setError(errorMessage);
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach(error => {
          backendErrors[error.param] = error.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Mark Attendance
      </h3>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Multi-Select Dropdown with Search */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Employees * (Multiple selection allowed)
          </label>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.employee_ids ? 'border-red-500' : 'border-gray-300'
              }`}
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
          {formData.employee_ids.length > 0 && (
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              {formData.employee_ids.length} employee(s) selected
            </p>
          )}

          {/* Dropdown List */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {/* Select All Button */}
              {filteredEmployees.length > 0 && (
                <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  >
                    {filteredEmployees.every(emp => formData.employee_ids.includes(emp.employee_id))
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}

              {/* Employee List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No employees found
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = formData.employee_ids.includes(emp.employee_id);
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
                          onChange={() => toggleEmployee(emp.employee_id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {emp.full_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {emp.employee_id} • {emp.department} • {emp.email}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {errors.employee_ids && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_ids}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]} // Cannot select future dates
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={submitting || formData.employee_ids.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {submitting 
              ? `Marking for ${formData.employee_ids.length} employee(s)...` 
              : `Mark Attendance for ${formData.employee_ids.length || 'Selected'} Employee(s)`
            }
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AttendanceForm;

