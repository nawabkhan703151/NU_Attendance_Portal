import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewTeacher.css';

function ViewDepartment() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true); // set true by default

  useEffect(() => {
    axios
      .get('http://localhost:4000/department/')
      .then((response) => {
        setDepartments(response.data); // backend returns plain array
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
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

      <h1 className="page-titles">Departments</h1>
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      <div className="main-content">
        <div className="student-info">
          <h2 className="section-title">Department List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : departments.length === 0 ? (
            <p>No departments found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Department ID</th>
                    <th>Department Name</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.sr_no}>
                      <td>{dept.sr_no}</td>
                      <td>{dept.d_id}</td>
                      <td>{dept.d_name}</td>
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

export default ViewDepartment;
