

import { useState } from 'react';
import { employeeAPI } from '../services/api';
import ErrorMessage from './ErrorMessage';

function EmployeeForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

    if (!formData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
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
      await employeeAPI.create(formData);
      // Reset form
      setFormData({
        employee_id: '',
        full_name: '',
        email: '',
        department: ''
      });
      onSuccess();
    } catch (err) {
      // Handle duplicate email or employee_id errors
      if (err.response?.status === 409) {
        const errorMessage = err.response?.data?.detail || 'Employee ID or Email already exists';
        setError(errorMessage);
        
        // Set field-specific errors
        if (errorMessage.includes('Employee ID')) {
          setErrors({ employee_id: 'This Employee ID is already registered' });
        } else if (errorMessage.includes('Email')) {
          setErrors({ email: 'This Email is already registered' });
        }
      } else {
        const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to create employee';
        setError(errorMessage);
        
        // Handle validation errors from backend
        if (err.response?.data?.errors) {
          const backendErrors = {};
          err.response.data.errors.forEach(error => {
            backendErrors[error.param] = error.msg;
          });
          setErrors(backendErrors);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Add New Employee
      </h3>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Employee ID *
          </label>
          <input
            type="text"
            name="employee_id"
            value={formData.employee_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.employee_id ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., EMP001"
          />
          {errors.employee_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.full_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., John Doe"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.full_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., john.doe@company.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department *
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.department ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Engineering, HR, Sales"
          />
          {errors.department && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {submitting ? 'Adding...' : 'Add Employee'}
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

export default EmployeeForm;

