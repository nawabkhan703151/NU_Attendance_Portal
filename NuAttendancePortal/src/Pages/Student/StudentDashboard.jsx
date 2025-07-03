import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import '../../Styles/Student/StudentDashboard.css';
import { Baseurl } from '../../../config/Login';

const StudentDashboard = () => {
  const navigate = useNavigate();

  // State variables
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [error, setError] = useState(null);
  const [complaintsError, setComplaintsError] = useState(null);

  // Determine color for attendance percentage badge
  const getColorForPercentage = (percentage) => {
    if (percentage >= 90) return '#22c55e'; // Green
    if (percentage >= 70) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Determine color for appeal status
  const getColorForAppeal = (appealStatus) => {
    if (!appealStatus) return '#808080';
    switch (appealStatus.toLowerCase()) {
      case 'pending':
        return '#f97316';
      case 'accepted':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      default:
        return '#808080';
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !storedUser || storedUser.role !== 'student') {
      navigate('/');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  // Fetch courses and complaints when user is set
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.st_id) return;

      await fetchCourses();
      await fetchComplaints();
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Fetch enrolled courses
  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');

      const studentId = user.st_id;
      const apiUrl = `${Baseurl}/timetable/student/${studentId}`;
      console.log('Fetching all enrolled courses from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {}
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Response from server is not in JSON format');
      }

      const apiResponse = await response.json();

      if (apiResponse.status === false) {
        setError(apiResponse.message || 'Could not fetch courses.');
        setCourses([]);
        return;
      }

      // Map API data to UI-friendly structure
      const mappedCourses = apiResponse.data.map((course) => ({
        _id: course._id,
        title: course.c_title,
        c_code: course.c_code,
        percentage:
          course.percentage !== undefined
            ? parseFloat(course.percentage)
            : 0,
        color:
          course.color ||
          getColorForPercentage(
            course.percentage !== undefined
              ? parseFloat(course.percentage)
              : 0
          ),
        schedules: course.schedules || [],
        program: course.program || 'Unknown',
        department: course.department || 'Unknown',
      }));

      setCourses(mappedCourses);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error.message);
      setError(`Failed to load courses: ${error.message}`);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch complaint status
  const fetchComplaints = async () => {
    if (!user || !user.st_id) return;

    setIsLoadingComplaints(true);
    setComplaintsError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');

      const studentId = user.st_id;
      const apiUrl = `${Baseurl}/attendance/student/${studentId}/complaint-status`;
      console.log('Fetching complaint status from:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {}
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Response from server is not in JSON format');
      }

      const apiResponse = await response.json();

      if (apiResponse.status === false) {
        setComplaintsError(apiResponse.message || 'Could not fetch complaints.');
        setComplaints([]);
        return;
      }

      setComplaints(apiResponse.data || []);
    } catch (error) {
      console.error('Error fetching complaint status:', error.message);
      setComplaintsError(`Failed to load complaints: ${error.message}`);
      setComplaints([]);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  // Refresh complaints data
  const refreshComplaints = async () => {
    await fetchComplaints();
  };

  // Logout handler
  const handleLogout = (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // On click of view button navigate to attendance view page with course info
  const handleViewClick = (course) => {
    if (!user || !user.st_id) return;

    navigate(`/view-student/${course.c_code}`, {
      state: {
        courseId: course._id,
        courseCode: course.c_code,
        courseTitle: course.title,
        program: course.program,
        department: course.department,
        studentId: user.st_id,
      },
    });
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="dashboard-container">
      <a href="#" className="logout-link" onClick={handleLogout}>
        <FaSignOutAlt className="link-icon" /> Logout
      </a>

      <aside className="sidebar">
        <div className="logo-container">
          <img
            src="/logo.png"
            alt="University Logo"
            className="logo"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
          />
          <h1 className="page-titles">NU Attendance Portal</h1>
        </div>
        <nav>
          <ul className="nav-list">
            <li className="nav-link active">
              <FaTachometerAlt className="link-icon" /> Student Dashboard
            </li>
            <li>
              <div className="user-info">
                <p>{user.username}</p>
                <p>Student ID: {user.st_id}</p>
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        {error && (
          <div className="error-message">
            {error.split('\n').map((str, index) => (
              <p key={index}>{str}</p>
            ))}
          </div>
        )}

        <section className="courses-section">
          <h2 className="section-title">My Enrolled Courses (Full Semester)</h2>
          <div className="table-container">
            {isLoading && courses.length === 0 ? (
              <div>Loading enrolled courses...</div>
            ) : !isLoading && courses.length === 0 && !error ? (
              <div>No courses enrolled for this semester or data is unavailable.</div>
            ) : courses.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Program</th>
                    <th>Attendance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course._id || index}>
                      <td>{course.c_code}</td>
                      <td>{course.title}</td>
                      <td>{course.program}</td>
                      <td>
                        <span
                          className="percentage-badge"
                          style={{ backgroundColor: course.color }}
                        >
                          {course.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <button
                          className="view-link"
                          onClick={() => handleViewClick(course)}
                        >
                          <FaEye className="link-icon" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </section>

        <section className="corrections-section">
          <div className="section-header">
            <h2 className="section-title">Correction Box</h2>
            <button 
              className="refresh-btn"
              onClick={refreshComplaints}
              disabled={isLoadingComplaints}
            >
              {isLoadingComplaints ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="table-container">
            {complaintsError && (
              <div className="error-message">
                {complaintsError}
              </div>
            )}
            {isLoadingComplaints && complaints.length === 0 ? (
              <div>Loading complaint status...</div>
            ) : !isLoadingComplaints && complaints.length === 0 && !complaintsError ? (
              <div>No complaints submitted yet.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Current Status</th>
                    <th>Appeal Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint, index) => (
                    <tr key={index}>
                      <td>{complaint.date}</td>
                      <td>{complaint.subject}</td>
                      <td className={complaint.status === 'Present' ? 'status-present' : 'status-absent'}>
                        {complaint.status}
                      </td>
                      <td style={{ color: getColorForAppeal(complaint.appeal) }}>
                        {complaint.appeal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;  