// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
// import '../../Styles/Teacher/MarkAttendance.css';
// import { Baseurl } from '../../../config/Login';

// function MarkAttendance() {
//   const { course } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [students, setStudents] = useState([]);
//   const [attendance, setAttendance] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [user, setUser] = useState(null);
//   const [timeFrom, setTimeFrom] = useState('');
//   const [timeTo, setTimeTo] = useState('');
//   const [courseName, setCourseName] = useState('');
//   const [selectedDate, setSelectedDate] = useState('');
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');

//   // Normalize time format to HH:mm AM/PM
//   const normalizeTime = (time) => {
//     try {
//       let formattedTime = decodeURIComponent(time).trim();
//       const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?:\s*(AM|PM))?$/i;
//       const match = formattedTime.match(timeRegex);

//       if (!match) {
//         throw new Error(`Invalid time format: ${formattedTime}. Expected format: HH:mm or HH:mm AM/PM`);
//       }

//       let [_, hours, minutes, period] = match;
//       hours = parseInt(hours, 10);

//       if (!period) {
//         period = hours >= 12 ? 'PM' : 'AM';
//       } else {
//         period = period.toUpperCase();
//       }

//       if (period === 'PM' && hours !== 12) hours += 12;
//       if (period === 'AM' && hours === 12) hours = 0;

//       const suffix = hours >= 12 ? 'PM' : 'AM';
//       const displayHours = hours % 12 === 0 ? 12 : hours % 12;
//       return `${String(displayHours).padStart(2, '0')}:${minutes} ${suffix}`;
//     } catch (error) {
//       console.error('Time normalization error:', error);
//       return null;
//     }
//   };

//   // Validate state parameters
//   useEffect(() => {
//     if (!location.state?.timeFrom || !location.state?.timeTo || !location.state?.selectedDate) {
//       setError('Missing required parameters. Please select a class from the dashboard.');
//       navigate('/teacher-dashboard');
//       return;
//     }

//     try {
//       const normalizedTimeFrom = normalizeTime(location.state.timeFrom);
//       const normalizedTimeTo = normalizeTime(location.state.timeTo);
//       if (!normalizedTimeFrom || !normalizedTimeTo) {
//         throw new Error('Invalid time format');
//       }
//       if (!/^\d{2}-\d{2}-\d{4}$/.test(location.state.selectedDate)) {
//         throw new Error('Invalid date format');
//       }
//       setTimeFrom(normalizedTimeFrom);
//       setTimeTo(normalizedTimeTo);
//       setSelectedDate(location.state.selectedDate);
//     } catch (error) {
//       console.error('Parameter validation error:', error);
//       setError('Invalid date or time format. Please select a valid class.');
//       navigate('/teacher-dashboard');
//     }
//   }, [location.state, navigate]);

//   // Fetch user data
//   useEffect(() => {
//     const storedUser = JSON.parse(localStorage.getItem('user'));
//     const token = localStorage.getItem('token');
//     if (!token || !storedUser || storedUser.role !== 'teacher' || !storedUser.t_id) {
//       setError('Invalid session. Please log in again.');
//       navigate('/');
//       return;
//     }
//     setUser(storedUser);
//   }, [navigate]);

//   // Fetch enrolled students
//   useEffect(() => {
//     const fetchStudents = async () => {
//       if (!user?.t_id || !timeFrom || !timeTo || !selectedDate || !course) return;
//       setLoading(true);
//       setError(null);
//       try {
//         const token = localStorage.getItem('token');
//         // Ensure proper encoding for URL
//         const encodedCourse = encodeURIComponent(course);
//         const encodedDate = encodeURIComponent(selectedDate);
//         const encodedTimeFrom = encodeURIComponent(timeFrom.replace(/\s+/g, ' '));
//         const encodedTimeTo = encodeURIComponent(timeTo.replace(/\s+/g, ' '));
//         const url = `${Baseurl}/attendance/${encodedCourse}/${encodedDate}/${encodedTimeFrom}/${encodedTimeTo}/students`;
//         console.log('Fetching students from:', url); // Debugging

//         const response = await fetch(url, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('API Response:', data); // Debugging
//         if (data.status && Array.isArray(data.data) && data.data.length > 0) {
//           setStudents(data.data);
//           setAttendance(
//             data.data.map((student) => ({
//               id: student.regNo,
//               rollNo: student.regNo,
//               name: student.name,
//               status: 'A', // Default to Absent
//             }))
//           );
//           setCourseName(data.courseName || course);
//         } else {
//           setError(data.message || 'No students enrolled for this course and time slot.');
//           setStudents([]);
//           setAttendance([]);
//         }
//       } catch (err) {
//         console.error('Fetch error:', err);
//         setError(err.message || 'Failed to fetch students. Please check course code, date, or time slot.');
//         setStudents([]);
//         setAttendance([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStudents();
//   }, [user, course, selectedDate, timeFrom, timeTo]);

//   // Handle status change
//   const handleStatusChange = (id, status) => {
//     setAttendance((prev) =>
//       prev.map((item) => (item.id === id ? { ...item, status } : item))
//     );
//   };

//   // Handle form submission
//   const handleSubmit = async () => {
//     if (!user?.t_id || !timeFrom || !timeTo || !selectedDate || !course) {
//       setErrorMessage('Missing required data. Please select a valid class.');
//       return;
//     }
//     if (attendance.length === 0) {
//       setErrorMessage('No students available to mark attendance.');
//       return;
//     }

//     setLoading(true);
//     setErrorMessage('');
//     try {
//       const attendanceData = attendance.map((item) => ({
//         st_id: item.rollNo,
//         status: item.status,
//       }));

//       const response = await fetch(`${Baseurl}/attendance/mark`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${localStorage.getItem('token')}`,
//         },
//         body: JSON.stringify({
//           t_id: user.t_id,
//           c_code: course,
//           date: selectedDate,
//           timeFrom,
//           timeTo,
//           attendanceData,
//         }),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to submit attendance');
//       }

//       setSuccessMessage(`Attendance successfully submitted! ${data.totalRecords} records saved.`);
//       setShowSuccessModal(true);
//     } catch (err) {
//       console.error('Submit error:', err);
//       setErrorMessage(err.message || 'Failed to submit attendance. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle modal close
//   const handleCloseModal = () => {
//     setShowSuccessModal(false);
//     navigate('/teacher-dashboard');
//   };

//   // Format date for display
//   const formatDisplayDate = () => {
//     if (!selectedDate) return 'N/A';
//     const [day, month, year] = selectedDate.split('-');
//     return `${day}-${month}-${year}`;
//   };

//   return (
//     <div className="teacher-dashboard">
//       <aside className="sidebar">
//         <div className="logo-container">
//           <img src="/logo.png" alt="NU Logo" className="logo" />
//         </div>
//         <nav className="nav-list">
//           <div className="nav-link" onClick={() => navigate('/teacher-dashboard')}>
//             <FaArrowLeft className="link-icon" /> Back to Dashboard
//           </div>
//         </nav>
//       </aside>
//       <main className="main-content">
//         <h1 className="page-titles">Mark Attendance - {course}</h1>
//         <div
//           className="logout-link"
//           onClick={() => {
//             localStorage.removeItem('token');
//             localStorage.removeItem('user');
//             navigate('/');
//           }}
//         >
//           <FaCheckCircle className="link-icon" /> Logout
//         </div>
//         <section className="attendance-section">
//           <div className="header-info">
//             <p><strong>Teacher Name:</strong> {user?.username || 'N/A'}</p>
//             <p><strong>Subject Name:</strong> {courseName || course}</p>
//             <p><strong>Course Code:</strong> {course}</p>
//             <p><strong>Date:</strong> {formatDisplayDate()}</p>
//             <p><strong>Time:</strong> {timeFrom} - {timeTo}</p>
//           </div>
//           {loading ? (
//             <div className="loading-spinner">Loading students...</div>
//           ) : error || errorMessage ? (
//             <p className="error-message">{error || errorMessage}</p>
//           ) : students.length === 0 ? (
//             <p>No students enrolled for this course or time slot.</p>
//           ) : (
//             <>
//               <p>Total Students: {students.length}</p>
//               <div className="table-container">
//                 <table className="data-table">
//                   <thead>
//                     <tr>
//                       <th>SrNo</th>
//                       <th>Reg No</th>
//                       <th>Student Name</th>
//                       <th>Status</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {attendance.map((student, index) => (
//                       <tr key={student.id || `student-${index}`}>
//                         <td>{index + 1}</td>
//                         <td>{student.rollNo}</td>
//                         <td>{student.name}</td>
//                         <td>
//                           <select
//                             className="status-select"
//                             value={student.status}
//                             onChange={(e) => handleStatusChange(student.id, e.target.value)}
//                           >
//                             <option value="A">A</option>
//                             <option value="P">P</option>
//                           </select>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               <button
//                 className="submit-btn"
//                 onClick={handleSubmit}
//                 disabled={loading || students.length === 0}
//               >
//                 {loading ? 'Submitting...' : 'Submit Attendance'}
//               </button>
//             </>
//           )}
//         </section>
//       </main>

//       {showSuccessModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <FaCheckCircle className="modal-icon success-icon" />
//             <h2 className="modal-title">Success!</h2>
//             <p className="modal-message">{successMessage}</p>
//             <button className="modal-close-btn" onClick={handleCloseModal}>
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import '../../Styles/Teacher/MarkAttendance.css';
import { Baseurl } from '../../../config/Login';

function MarkAttendance() {
  const { course } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [courseName, setCourseName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const normalizeTime = (time) => {
    try {
      let formattedTime = decodeURIComponent(time).trim();
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?:\s*(AM|PM))?$/i;
      const match = formattedTime.match(timeRegex);
      if (!match) throw new Error(`Invalid time format: ${formattedTime}`);

      let [_, hours, minutes, period] = match;
      hours = parseInt(hours, 10);
      period = period ? period.toUpperCase() : hours >= 12 ? 'PM' : 'AM';

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const suffix = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `${String(displayHours).padStart(2, '0')}:${minutes} ${suffix}`;
    } catch (error) {
      console.error('Time normalization error:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!location.state?.timeFrom || !location.state?.timeTo || !location.state?.selectedDate) {
      setError('Missing required parameters. Please select a class from the dashboard.');
      navigate('/teacher-dashboard');
      return;
    }

    try {
      const normalizedTimeFrom = normalizeTime(location.state.timeFrom);
      const normalizedTimeTo = normalizeTime(location.state.timeTo);
      if (!normalizedTimeFrom || !normalizedTimeTo) throw new Error('Invalid time format');

      if (!/^\d{2}-\d{2}-\d{4}$/.test(location.state.selectedDate)) {
        throw new Error('Invalid date format');
      }

      setTimeFrom(normalizedTimeFrom);
      setTimeTo(normalizedTimeTo);
      setSelectedDate(location.state.selectedDate);
    } catch (error) {
      setError('Invalid date or time format. Please select a valid class.');
      navigate('/teacher-dashboard');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!token || !storedUser || storedUser.role !== 'teacher' || !storedUser.t_id) {
      setError('Invalid session. Please log in again.');
      navigate('/');
      return;
    }
    setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.t_id || !timeFrom || !timeTo || !selectedDate || !course) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const url = `${Baseurl}/attendance/${encodeURIComponent(course)}/${encodeURIComponent(selectedDate)}/${encodeURIComponent(timeFrom)}/${encodeURIComponent(timeTo)}/students`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error fetching students');

        if (data.status && Array.isArray(data.data) && data.data.length > 0) {
          setStudents(data.data);
          setAttendance(
            data.data.map((s) => ({
              id: s.regNo,
              rollNo: s.regNo,
              name: s.name,
              status: s.status || 'A',
            }))
          );
          setCourseName(data.data[0]?.courseTitle || course);
        } else {
          setError(data.message || 'No students enrolled.');
        }
      } catch (err) {
        setError(err.message);
        setStudents([]);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user, course, selectedDate, timeFrom, timeTo]);

  const handleStatusChange = (id) => {
    setAttendance((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'P' ? 'A' : 'P' } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!user?.t_id || !timeFrom || !timeTo || !selectedDate || !course) {
      setErrorMessage('Missing required data.');
      return;
    }
    if (attendance.length === 0) {
      setErrorMessage('No students to submit.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const attendanceData = attendance.map((item) => ({
        st_id: item.rollNo,
        status: item.status,
      }));

      const response = await fetch(`${Baseurl}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          t_id: user.t_id,
          c_code: course,
          date: selectedDate,
          timeFrom,
          timeTo,
          attendanceData,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setSuccessMessage(`Attendance submitted! ${data.total} records saved.`);
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/teacher-dashboard');
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return 'N/A';
    const [d, m, y] = selectedDate.split('-');
    return `${d}-${m}-${y}`;
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
        <h1 className="page-titles">Mark Attendance - {course}</h1>
        <div
          className="logout-link"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
          }}
        >
          <FaCheckCircle className="link-icon" /> Logout
        </div>
        <section className="attendance-section">
          <div className="header-info">
            <p><strong>Teacher Name:</strong> {user?.username || 'N/A'}</p>
            <p><strong>Subject Name:</strong> {courseName || course}</p>
            <p><strong>Course Code:</strong> {course}</p>
            <p><strong>Date:</strong> {formatDisplayDate()}</p>
            <p><strong>Time:</strong> {timeFrom} - {timeTo}</p>
          </div>
          {loading ? (
            <div className="loading-spinner">Loading students...</div>
          ) : error || errorMessage ? (
            <p className="error-message">{error || errorMessage}</p>
          ) : students.length === 0 ? (
            <p>No students enrolled.</p>
          ) : (
            <>
              <p>Total Students: {students.length}</p>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SrNo</th>
                      <th>Reg No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((s, index) => (
                      <tr key={s.id}>
                        <td>{index + 1}</td>
                        <td>{s.rollNo}</td>
                        <td>{s.name}</td>
                        <td>
                          <button
                            className={`toggle-btn ${s.status === 'P' ? 'present' : 'absent'}`}
                            onClick={() => handleStatusChange(s.id)}
                          >
                            {s.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </>
          )}
        </section>
      </main>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FaCheckCircle className="modal-icon success-icon" />
            <h2 className="modal-title">Success!</h2>
            <p className="modal-message">{successMessage}</p>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkAttendance;