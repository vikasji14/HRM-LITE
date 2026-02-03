

import { useState } from 'react';

function MultiSelectEmployees({ employees, selectedIds, onChange, error }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmployee = (employeeId) => {
    if (selectedIds.includes(employeeId)) {
      onChange(selectedIds.filter(id => id !== employeeId));
    } else {
      onChange([...selectedIds, employeeId]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      onChange([]);
    } else {
      onChange(filteredEmployees.map(emp => emp.employee_id));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Employees * (Multiple selection allowed)
      </label>
      
      {/* Search Box */}
      <input
        type="text"
        placeholder="Search employees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />

      {/* Select All Button */}
      <div className="mb-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {selectedIds.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
        </button>
        {selectedIds.length > 0 && (
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Employee List */}
      <div className={`border rounded-lg max-h-64 overflow-y-auto ${
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
      }`}>
        {filteredEmployees.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No employees found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedIds.includes(emp.employee_id);
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
                      {emp.employee_id} • {emp.department}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default MultiSelectEmployees;

