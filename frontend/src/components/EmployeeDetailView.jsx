

function EmployeeDetailView({ employee, attendance, selectedMonth, onMonthChange, onBack, onMonthChangeCallback }) {
  // Get attendance for a specific date
  const getAttendanceForDate = (date) => {
    return attendance.find(record => record.date === date);
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

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = monthNames[month - 1];

  // Calculate statistics for selected month
  const monthAttendance = attendance.filter(a => {
    const recordMonth = a.date.slice(0, 7);
    return recordMonth === selectedMonth;
  });

  const presentDays = monthAttendance.filter(a => a.status === 'Present').length;
  const absentDays = monthAttendance.filter(a => a.status === 'Absent').length;
  const totalDays = monthAttendance.length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employee Details
          </h2>
        </div>
      </div>

      {/* Employee Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-3xl">
              {employee.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {employee.full_name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Employee ID:</span> {employee.employee_id}
              </div>
              <div>
                <span className="font-medium">Department:</span> {employee.department}
              </div>
              <div>
                <span className="font-medium">Email:</span> {employee.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector and Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attendance Calendar - {monthName} {year}
          </h3>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              onMonthChange(e.target.value);
              if (onMonthChangeCallback) {
                onMonthChangeCallback(e.target.value);
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Statistics for Selected Month */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Days</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {presentDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Present</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {absentDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Absent</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {percentage}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Attendance</div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week Day Headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2 bg-gray-50 dark:bg-gray-700/50 rounded"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-12"></div>;
            }

            const attendanceRecord = getAttendanceForDate(date);
            const dayNumber = parseInt(date.split('-')[2]);
            const isToday = date === new Date().toISOString().split('T')[0];

            return (
              <div
                key={date}
                className={`h-12 border rounded-lg p-1 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                  attendanceRecord
                    ? attendanceRecord.status === 'Present'
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700'
                      : 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                } ${isToday ? 'ring-1 ring-blue-500 dark:ring-blue-400' : ''}`}
                title={attendanceRecord ? `${date}: ${attendanceRecord.status}` : `${date}: No record`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isToday
                      ? 'text-blue-600 dark:text-blue-400'
                      : attendanceRecord
                      ? attendanceRecord.status === 'Present'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {dayNumber}
                </span>
                {attendanceRecord && (
                  <span
                    className={`text-[10px] mt-0.5 font-semibold ${
                      attendanceRecord.status === 'Present'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {attendanceRecord.status === 'Present' ? '✓' : '✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-700 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">No Record</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 rounded ring-2 ring-blue-500 dark:ring-blue-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailView;

