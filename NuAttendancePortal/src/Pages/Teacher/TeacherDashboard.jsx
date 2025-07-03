import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaEye, FaSignOutAlt, FaChalkboardTeacher, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../Styles/Teacher/TeacherDashboard.css';
import { Baseurl } from '../../../config/Login';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const calendarRef = useRef(null);
  const [attendanceMarked, setAttendanceMarked] = useState({});

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const normalizeTime = (time) => {
    let formattedTime = time.trim();
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?:\s*(AM|PM))?$/i;
    const match = formattedTime.match(timeRegex);
    if (!match) throw new Error(`Invalid time format: ${formattedTime}`);
    let [_, hours, minutes, period] = match;
    hours = parseInt(hours, 10);
    if (!period) period = hours >= 12 ? 'PM' : 'AM';
    period = period.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${suffix}`;
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!token || !storedUser || storedUser.role !== 'teacher') {
      navigate('/');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const token = localStorage.getItem('token');
        const formattedDate = formatDate(selectedDate);
        const response = await fetch(`${Baseurl}/timetable/teacher/${user?.t_id}/${formattedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.timetable?.length > 0) {
          const formattedTimetable = data.timetable.map(item => ({
            _id: item.timetable_id,
            day: item.day,
            time: `${item.TimeFrom}-${item.TimeTo}`,
            timeFrom: item.TimeFrom,
            timeTo: item.TimeTo,
            room: item.roomName || 'N/A',
            course: item.c_code || 'N/A',
            courseTitle: item.c_title || 'N/A',
            session_name: item.session_name || 'N/A',
          }));
          setTimetable(formattedTimetable);
          setError(null);
        } else {
          setTimetable([]);
          setError(data.message || 'No Class for this day');
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setTimetable([]);
        setError('Timetable fetch issue. try again.');
      }
    };

    if (user?.t_id) fetchTimetable();
  }, [user, selectedDate]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${Baseurl}/attendance/${user?.t_id}/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.success && data.data?.length > 0) {
          const formattedComplaints = data.data.map((item) => ({
            stId: item.student.st_id,
            courseCode: item.course.code,
            courseTitle: item.course.title,
            date: item.date,
            status: item.status,
            comment: item.comment,
            complaintStatus: item.complaintStatus,
            timetableId: item.timetableId,
          }));
          setComplaints(formattedComplaints);
        } else {
          setComplaints([]);
          setError(data.message || 'No Pending Complaints');
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
        setComplaints([]);
        setError('Complaints fetching issue. try again.');
      }
    };

    if (user?.t_id) fetchComplaints();
  }, [user]);

  const handleComplaint = async (stId, courseCode, date, action, timetableId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${Baseurl}/attendance/complaint/response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stId,
          courseCode,
          date,
          action: action === 'accept' ? 'Accepted' : 'Rejected',
          teacherId: user.t_id,
          timetableId,
        }),
      });
      const data = await response.json();

      if (response.ok && data.status) {
        setComplaints(prev =>
          prev.filter(c => !(c.stId === stId && c.courseCode === courseCode && c.date === date))
        );
        setSuccessMessage(`Complaint ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setError(null);
      } else {
        setError(data.message || 'Complaint handling issue.');
      }
    } catch (error) {
      console.error('Complaint handling error:', error);
      setError('Complaint handling issue. try again.');
    }
  };

  const handleMarkAttendance = (course, timeFrom, timeTo) => {
    try {
      const formattedDate = formatDate(selectedDate);
      if (!formattedDate || !/^\d{2}-\d{2}-\d{4}$/.test(formattedDate)) {
        setError('Invalid date selected.');
        return;
      }
      const normalizedTimeFrom = normalizeTime(timeFrom);
      const normalizedTimeTo = normalizeTime(timeTo);
      navigate(`/mark-attendance/${encodeURIComponent(course)}`, {
        state: { selectedDate: formattedDate, timeFrom: normalizedTimeFrom, timeTo: normalizedTimeTo },
      });
      setAttendanceMarked(prev => ({
        ...prev,
        [course]: true,
      }));
    } catch (error) {
      console.error('Time normalization error:', error);
      setError('Invalid time format.');
    }
  };

  const handleViewAttendance = (course) => {
    const formattedDate = formatDate(selectedDate);
    navigate(`/view-attendance/${encodeURIComponent(course)}`, {
      state: { selectedDate: formattedDate, t_id: user.t_id },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="teacher-dashboard">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" alt="NU Logo" className="logo" />
        </div>
        <nav className="nav-list">
          <div className="nav-link active" onClick={() => navigate('/teacher-dashboard')}>
            <FaChalkboardTeacher className="link-icon" /> Teacher Dashboard
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <h1 className="page-titles">NU Attendance Portal</h1>
        <div className="logout-link" onClick={handleLogout}>
          <FaSignOutAlt className="link-icon" /> Logout
        </div>
        <div className="header-info">
          <p className="teacher-name">Name: {user.username}</p>
          <p className="teacher-id">Teacher ID: {user.t_id}</p>
          <div className="date-container" onClick={toggleCalendar}>
            <FaCalendarAlt className="calendar-icon" />
            <p className="header-date">{formatDate(selectedDate)}</p>
          </div>
          {showCalendar && (
            <div ref={calendarRef} className="calendar-wrapper">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setShowCalendar(false);
                }}
                inline
                calendarClassName="custom-datepicker"
              />
            </div>
          )}
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <p className="error-message">{error}</p>}

        <section className="timetable-section">
          <h2 className="section-title">Timetable</h2>
          <div className="timetable-container">
            {timetable.length > 0 ? (
              timetable.map((item) => (
                <div key={item._id} className="timetable-card">
                  <div className="card-content">
                    <p><strong>Course Title:</strong> {item.courseTitle}</p>
                    <p><strong>Day:</strong> {item.day}</p>
                    <p><strong>Time:</strong> {item.time}</p>
                    <p><strong>Room:</strong> {item.room}</p>
                    <p><strong>Session:</strong> {item.session_name}</p>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="action-btn mark-btn" 
                      onClick={() => handleMarkAttendance(item.course, item.timeFrom, item.timeTo)}
                      disabled={attendanceMarked[item.course] || false}
                    >
                      <FaClipboardList /> Mark
                    </button>
                    <button className="action-btn view-btn" onClick={() => handleViewAttendance(item.course)}>
                      <FaEye /> View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>Is din ke liye koi classes scheduled nahi hain.</p>
            )}
          </div>
        </section>

   <section className="correction-section">
  <h2 className="section-title">Complaints Panel</h2>
  {complaints.length > 0 ? (
    complaints.map((item, index) => (
      <div key={index} className="correction-card">
        <div className="card-content">
          <h3><strong>Student ID:</strong> {item.stId}</h3>
          <p><strong>Course:</strong> {item.courseTitle} ({item.courseCode})</p>
          <p><strong>Date:</strong> {item.date}</p>
          <p><strong>Attendance Status:</strong> {item.status}</p> {/* ✅ Attendance status */}
          <p><strong>Complaint Status:</strong> {item.complaintStatus}</p> {/* ✅ Complaint Status */}
          
        </div>
        <div className="card-actions">
          <button
            className="action-btn accept-btn"
            onClick={() => handleComplaint(item.stId, item.courseCode, item.date, 'accept', item.timetableId)}
          >
            <FaCheck /> Accept
          </button>
          <button
            className="action-btn reject-btn"
            onClick={() => handleComplaint(item.stId, item.courseCode, item.date, 'reject', item.timetableId)}
          >
            <FaTimes /> Reject
          </button>
        </div>
      </div>
    ))
  ) : (
    <p>No pending complaints.</p>
  )}
</section>

      </main>
    </div>
  );
}

export default TeacherDashboard;









