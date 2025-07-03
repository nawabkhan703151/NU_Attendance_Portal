import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MdReportProblem } from 'react-icons/md';
import { Baseurl } from '../../../config/Login';
import '../../Styles/Student/ViewStudent.css';

const SuccessModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{message.title || "Notification"}</h2>
        <p className="modal-subtitle">{message.body}</p>
        <div className="modal-buttons">
          <button className="modal-close-btn" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

// Helper to generate a unique key for each complaint
const getComplaintKey = (studentId, courseCode, date) => {
  return `complaint_${studentId}_${courseCode}_${date}`;
};

const ViewStudent = () => {
  const { course } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', body: '' });
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: '', courseCode: '', courseTitle: '' });

  const { studentId, courseCode } = location.state || {};

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!studentId || !courseCode) return;
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authorization token missing');

        const apiUrl = `${Baseurl}/attendance/student/${studentId}/course/${courseCode}/attendance`;
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} - ${await response.text()}`);
        }

        const apiResponse = await response.json();
        if (!apiResponse.status || !Array.isArray(apiResponse.data)) {
          throw new Error(apiResponse.message || 'Invalid data received');
        }

        const formattedData = apiResponse.data.map(record => {
          const localKey = getComplaintKey(studentId, courseCode, record.date);
          const isLocallySubmitted = localStorage.getItem(localKey) === 'submitted';

          return {
            ...record,
            formattedDate: formatDate(record.date),
            originalDate: record.date,
            hasComplaint: record.comment_status === 'Pending' || record.comment_status === 'Approved' || record.comment_status === 'Rejected' || isLocallySubmitted,
            complaintStatus: record.comment_status || (isLocallySubmitted ? 'Pending' : null),
            canComplain: !record.comment_status && record.status === 'A' && !isLocallySubmitted
          };
        });

        setAttendanceData(formattedData);
        setStudentInfo(prev => ({ ...prev, courseCode }));
      } catch (error) {
        setError(`Failed to load attendance data: ${error.message}`);
        setAttendanceData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [studentId, courseCode]);

  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleComplaint = async (index) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');

      const selectedRecord = attendanceData[index];
      if (!selectedRecord) throw new Error('Selected attendance record not found');

      const response = await fetch(`${Baseurl}/attendance/complaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stId: studentId,
          courseCode,
          date: selectedRecord.originalDate,
          comment: "Attendance marked incorrectly",
          teacherId: selectedRecord.teacherId,
          timetableId: selectedRecord.timetableId
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        setModalMessage({ title: 'Complaint Error', body: result.message || 'Failed to submit complaint' });
        setIsSuccessModalOpen(true);
        return;
      }

      // Save complaint flag locally
      const localKey = getComplaintKey(studentId, courseCode, selectedRecord.originalDate);
      localStorage.setItem(localKey, 'submitted');

      // Update local UI state
      setAttendanceData(prevData =>
        prevData.map((record, i) =>
          i === index
            ? { ...record, canComplain: false, hasComplaint: true, complaintStatus: 'Pending' }
            : record
        )
      );

      setModalMessage({ title: 'Success', body: 'Complaint submitted successfully' });
      setIsSuccessModalOpen(true);
    } catch (error) {
      setModalMessage({ title: 'Error', body: error.message || 'Failed to submit complaint' });
      setIsSuccessModalOpen(true);
    }
  };

  const presents = attendanceData.filter((record) => record.status === 'P').length;
  const absents = attendanceData.filter((record) => record.status === 'A').length;
  const totalClasses = attendanceData.length;
  const percentage = totalClasses > 0 ? ((presents / totalClasses) * 100).toFixed(0) : 0;

  const closeModal = () => setIsSuccessModalOpen(false);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (error) return <div className="error-message">{error}</div>;
  if (isLoading) return <div className="loading-message">Loading attendance data...</div>;

  return (
    <div className="view-student-container">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="University Logo" />
        </div>
        <nav className="nav-list">
          <a href="/student-dashboard" className="nav-link"><span className="link-icon">🏠</span> Dashboard</a>
          <a href="/student-dashboard" className="nav-link"><span className="link-icon">📚</span> Courses</a>
        </nav>
      </div>

      <div className="main-content">
        <a href="/" className="logout-link" onClick={handleLogout}><span className="link-icon">🚪</span> Logout</a>
        <h1 className="page-titles">NU Attendance Portal</h1>

        <div className="student-info">
          <h2 className="section-title">Student Details</h2>
          <div className="info-card">
            <p><strong>Student ID:</strong> {studentId}</p>
            <p><strong>Course Code:</strong> {studentInfo.courseCode}</p>
          </div>
        </div>

        <div className="attendance-section">
          <h2 className="section-title">Attendance Records</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.length > 0 ? (
                  attendanceData.map((record, index) => (
                    <tr key={index}>
                      <td>{record.formattedDate}</td>
                      <td className={record.status === 'P' ? 'status-present' : 'status-absent'}>
  {record.status}
</td>

                      <td>
                        <button
                          className={`complain-button ${record.canComplain ? 'active' : 'inactive'}`}
                          onClick={() => record.canComplain && handleComplaint(index)}
                          disabled={!record.canComplain}
                          title={
                            record.hasComplaint
                              ? 'Complaint already submitted'
                              : record.status !== 'A'
                                ? 'Only for absent records'
                                : 'Submit complaint'
                          }
                        >
                          <MdReportProblem className="complain-icon" />
                          <span>{record.hasComplaint ? 'Submitted' : 'Complain'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center' }}>
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="summary-section">
          <h2 className="section-title">Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <span>Presents</span>
              <span className="summary-value">{presents}</span>
            </div>
            <div className="summary-item">
              <span>Absents</span>
              <span className="summary-value">{absents}</span>
            </div>
            <div className="summary-item">
              <span>Percentage</span>
              <span className="summary-value">{percentage}%</span>
            </div>
          </div>
        </div>

        <SuccessModal 
          isOpen={isSuccessModalOpen} 
          onClose={closeModal} 
          message={modalMessage} 
        />
      </div>
    </div>
  );
};

export default ViewStudent;
