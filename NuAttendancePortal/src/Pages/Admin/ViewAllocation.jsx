import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewAllocation.css';

function ViewAllocation() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:4000/allocation') // ✅ Matches your backend API
      .then((response) => {
        setAllocations(response.data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching allocations:', error);
        setError('Failed to fetch allocations. Please check the server or API endpoint.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="view-batch-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <div className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon">🏠</span> Back to Dashboard
          </a>
        </div>
      </div>

      {/* Page Title */}
      <h1 className="page-titles">Allocations</h1>

      {/* Logout */}
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      {/* Main Content */}
      <div className="main-content">
        <div className="batch-info">
          <h2 className="section-title">Allocation List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : allocations.length === 0 ? (
            <p>No Allocations found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Section</th>
                    <th>Session</th>
                    <th>Teachers</th>
                    <th>Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.sr_no}</td>
                      <td>{item.section_name}</td>
                      <td>{item.session_name}</td>
                      <td>{item.teachers.join(', ')}</td>
                      <td>{item.courses.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewAllocation;
