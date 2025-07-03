import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';
import '../../Styles/Teacher/ViewAttendance.css';
import { Baseurl } from '../../../config/Login';

function ViewAttendance() {
  const { course } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [attendanceData, setAttendanceData] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const t_id = state?.t_id;
        if (!token || !t_id) {
          throw new Error('Authentication token or Teacher ID missing');
        }

        const response = await fetch(`${Baseurl}/attendance/view?t_id=${t_id}&c_code=${course}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === false) {
          setError(data.message);
          setAttendanceData([]);
          setUniqueDates([]);
          return;
        }

        const allDates = data.data.flatMap(student =>
          student.attendance.map(record => record.date.split(' ')[0])
        );
        const dates = [...new Set(allDates)].sort((a, b) =>
          new Date(b.split('-').reverse().join('-')) -
          new Date(a.split('-').reverse().join('-'))
        );

        setAttendanceData(data.data || []);
        setUniqueDates(dates);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(`Failed to load attendance data: ${err.message}`);
        setAttendanceData([]);
        setUniqueDates([]);
      } finally {
        setLoading(false);
      }
    };

    if (state?.t_id) {
      fetchAttendance();
    } else {
      setError('Teacher ID not found. Please try again from dashboard.');
      setLoading(false);
    }
  }, [course, state]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatDate = (dateString) => {
    try {
      const [day, month, year] = dateString.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(month, 10) - 1];
      return `${day} ${monthName}, ${year}`;
    } catch {
      return dateString;
    }
  };

  const getStatusesForDate = (student, date) => {
    const records = student.attendance.filter(r => r.date.startsWith(date));
    return records.map((r, idx) => {
      const statusColor = r.status === 'P' ? 'green' : 'red';
      const timePart = r.date.includes(' ') ? r.date.split(' ')[1].substring(0, 5) : '';
      const displayStatus = timePart ? `${r.status} (${timePart})` : r.status;

      return (
        <span key={idx} style={{ color: statusColor, fontWeight: 'bold' }}>
          {displayStatus}
        </span>
      );
    });
  };

  return (
    <div className="teacher-dashboard">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" alt="NU Logo" className="logo" />
        </div>
        <nav className="nav-list">
          <div className="nav-link" onClick={() => navigate('/teacher-dashboard')}>
            <FaArrowLeft className="link-icon" /> Back to Dashboard
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <h1 className="page-titles">View Attendance - {course}</h1>
        <div className="logout-link" onClick={handleLogout}>
          <FaSignOutAlt className="link-icon" /> Logout
        </div>
        <section className="attendance-section">
          <h2 className="section-title">Attendance Records for {course}</h2>
          {error && <p className="error-message">{error}</p>}
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : attendanceData.length === 0 ? (
            <p>No attendance records found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Registration No</th>
                    <th>Student Name</th>
                    <th>Section Name</th>
                    <th>Average %</th>
                    <th>Total Present</th>
                    <th>Total Absent</th>
                    {uniqueDates.flatMap(date => {
                      const maxRecords = Math.max(
                        ...attendanceData.map(student =>
                          student.attendance.filter(r => r.date.startsWith(date)).length
                        )
                      );
                      return Array.from({ length: maxRecords }, (_, idx) => (
                        <th key={`${date}-${idx}`} className="date-column">
                          {formatDate(date)} {idx > 0 ? `(${idx + 1})` : ''}
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((student, index) => (
                    <tr key={student.reg_no || index}>
                      <td>{student.sr_no || index + 1}</td>
                      <td>{student.reg_no || 'N/A'}</td>
                      <td>{student.name || 'Unknown'}</td>
                      <td>{student.section_name || 'N/A'}</td>
                      <td style={{ color: student.color || 'black', fontWeight: 'bold' }}>
                        {student.percentage ? `${student.percentage}%` : '0%'}
                      </td>
                      <td>{student.total_present || 0}</td>
                      <td>{student.total_absent || 0}</td>
                      {uniqueDates.flatMap(date => {
                        const statuses = getStatusesForDate(student, date);
                        return statuses.map((statusSpan, idx) => (
                          <td key={`${date}-${idx}`} className="date-column">
                            {statusSpan}
                          </td>
                        ));
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ViewAttendance;
