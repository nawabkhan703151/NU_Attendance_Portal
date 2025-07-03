import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewTeacher.css';

function ViewTeacher() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://localhost:4000/teacher/all')
      .then((response) => {
        if (response.data.status) {
          setTeachers(response.data.data); // Using response.data.data as per API format
        } else {
          console.error('Failed to fetch teachers:', response.data.message);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching teachers:', error);
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

      <h1 className="page-titles">Teachers</h1>
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      <div className="main-content">
        <div className="student-info">
          <h2 className="section-title">Teachers List</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SrNo</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.sr_no}>
                      <td>{teacher.sr_no}</td>
                      <td>{teacher.name}</td>
                      <td>{teacher.department}</td>
                      <td>{teacher.phone}</td>
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

export default ViewTeacher;
