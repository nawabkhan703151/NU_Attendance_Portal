/* AdminViewAttendance.jsx */
import React, { useState } from 'react';
import axios from 'axios';
import '../../Styles/Admin/AdminViewAttendance.css';

function AdminViewAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    program: 'BSCS',
    semester: '',
    section: '',
    subject: 'Database',
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleViewClick = () => {
    setLoading(true);
    // Fetch data with updated filters on button click
    axios.get('http://localhost:5000/api/attendance', { params: filters })
      .then((response) => {
        setAttendance(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching attendance:', error);
        // Fallback dummy data from the image
        setAttendance([
          { srNo: 1, regNo: "212-NUN-0001", name: "Abdul Malik", percentage: "10%", status: "A" },
          { srNo: 2, regNo: "212-NUN-0002", name: "Alamgir Khan", percentage: "80%", status: "P" },
          { srNo: 3, regNo: "212-NUN-0003", name: "Daniel Khan", percentage: "50%", status: "P" },
          { srNo: 4, regNo: "212-NUN-0004", name: "Jamshed Khan", percentage: "50%", status: "P" },
          { srNo: 5, regNo: "212-NUN-0005", name: "Achad Khan", percentage: "40%", status: "P" },
        ]);
        setLoading(false);
      });
  };

  return (
    <div className="teacher-dashboard">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <div className="nav-list">
          <a href="/admin-dashboard" className="nav-link"><span className="link-icon">🏠</span> Back Dashboard</a>
        </div>
      </div>
      <h1 className="page-titles">View Attendance</h1>
      <a href="/" className="logout-link"><span className="link-icon">🚪</span> Logout</a>
      <div className="main-content">
        <div className="attendance-section">
          <div className="filter-container">
            <div className="filter-group">
              <label>Program</label>
              <select name="program" value={filters.program} onChange={handleFilterChange}>
                <option value="BSCS">BSCS</option>
                <option value="BSIT">BSIT</option>
                <option value="BSE">BS English</option>
                <option value="BSE">BBA</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Semester</label>
              <select name="semester" value={filters.semester} onChange={handleFilterChange}>
                <option value="">Select Semester</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Section</label>
              <select name="section" value={filters.section} onChange={handleFilterChange}>
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Subject</label>
              <select name="subject" value={filters.subject} onChange={handleFilterChange}>
                <option value="Database">Database</option>
                <option value="Programming">Programming</option>
                <option value="Networking">Networking</option>
              </select>
            </div>
            <div className="action-buttons">
              <button className="view-btn" onClick={handleViewClick}>
                View
              </button>
            </div>
          </div>
          {/* <div className="teacher-info">
            <p>Teacher: Mr Abdul Rehman</p>
            <p>Subject: Database</p>
            <p>Course Code: ECS-251</p>
          </div> */}
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : attendance.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>%age</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.srNo}>
                      <td>{record.srNo}</td>
                      <td>{record.regNo}</td>
                      <td>{record.name}</td>
                      <td>{record.percentage}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="loading-text">No data available. Click 'View' to load attendance.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminViewAttendance;