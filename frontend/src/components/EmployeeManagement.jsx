

import { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import EmployeeForm from './EmployeeForm';
import EmployeeList from './EmployeeList';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DeleteConfirmModal from './DeleteConfirmModal';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, employee: null });

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle employee creation
  const handleEmployeeCreated = () => {
    setShowForm(false);
    fetchEmployees();
  };

  // Handle delete button click - show confirmation modal
  const handleDeleteClick = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    setDeleteModal({ isOpen: true, employee });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteModal.employee) return;

    try {
      await employeeAPI.delete(deleteModal.employee.employee_id);
      setDeleteModal({ isOpen: false, employee: null });
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee');
      setDeleteModal({ isOpen: false, employee: null });
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, employee: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Employee Register
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Employee Form */}
      {showForm && (
        <EmployeeForm
          onSuccess={handleEmployeeCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Employee List */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <EmployeeList
          employees={employees}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        employee={deleteModal.employee}
      />
    </div>
  );
}

export default EmployeeManagement;

