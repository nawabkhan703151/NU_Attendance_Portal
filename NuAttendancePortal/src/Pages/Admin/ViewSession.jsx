import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewSession.css';
import { FaArrowLeft, FaBook, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ViewSession = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:4000/session');
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch session data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-batch-container">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <nav className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon"><FaBook /></span> Dashboard
          </a>
          <a href="/admin/add-session" className="nav-link">
            <span className="link-icon"><FaList /></span> Add Session
          </a>
        </nav>
      </div>

      <h2 className="page-titles">View All Sessions</h2>

      <div className="main-content">
        <div className="batch-info">
          <div className="section-title">Session Information</div>

          {loading ? (
            <div className="loading-spinner">Loading sessions...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Session ID</th>
                    <th>Session Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.ses_id}>
                      <td>{session.sr_no}</td>
                      <td>{session.ses_id}</td>
                      <td>{session.session_name}</td>
                      <td>{session.Start_date}</td>
                      <td>{session.End_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* <div className="form-actions">
            <button onClick={() => navigate('/admin-dashboard')} className="back-btn">
              <FaArrowLeft className="btn-icon" /> Back
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ViewSession;
