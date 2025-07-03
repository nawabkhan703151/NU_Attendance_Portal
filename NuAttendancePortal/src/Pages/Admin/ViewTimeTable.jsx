// src/Pages/Admin/ViewProgram.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewTimeTable.css'; // ✅ Reuse same style

function ViewTimeTable() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://localhost:4000/program/p') // ✅ API route
      .then((response) => {
        setPrograms(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching programs:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="view-student-container">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <div className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon">🏠</span> Back Dashboard
          </a>
        </div>
      </div>

      <h1 className="page-titles">Programs</h1>
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      <div className="main-content">
        <div className="student-info">
          <h2 className="section-title">TimeTable List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : programs.length === 0 ? (
            <p>No Timetable found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Program ID</th>
                    <th>Program Name</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((prog) => (
                    <tr key={prog.sr_no}>
                      <td>{prog.sr_no}</td>
                      <td>{prog.p_id}</td>
                      <td>{prog.p_name}</td>
                      <td>{prog.d_name}</td>
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

export default ViewTimeTable;
