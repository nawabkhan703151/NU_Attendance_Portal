import React, { useState, useEffect } from 'react';
import { FaEye, FaList, FaPrint } from 'react-icons/fa';
import '../../Styles/Admin/ShortAttendance.css';

const ShortAttendance = () => {
  // Sample data - replace with your actual data source
  const [students, setStudents] = useState([
    {
      id: 1,
      regNo: '212-NUN-001',
      name: 'Abdul Malik',
      department: 'BSCS',
      semester: '5',
      section: 'A',
      subject: 'Database',
      attendancePercentage: 10
    },
    {
      id: 2,
      regNo: '212-NUN-003',
      name: 'Danial Kahan',
      department: 'BSCS',
      semester: '5',
      section: 'A',
      subject: 'Database',
      attendancePercentage: 50
    },
    {
      id: 3,
      regNo: '212-NUN-005',
      name: 'Jamshed Kahan',
      department: 'BSCS',
      semester: '5',
      section: 'B',
      subject: 'Database',
      attendancePercentage: 50
    },
    {
      id: 4,
      regNo: '212-NUN-007',
      name: 'Yasir Khan',
      department: 'BSCS',
      semester: '5',
      section: 'A',
      subject: 'Database',
      attendancePercentage: 80
    },
    {
      id: 5,
      regNo: '212-NUN-009',
      name: 'Sara Ahmed',
      department: 'BSCS',
      semester: '6',
      section: 'B',
      subject: 'OOP',
      attendancePercentage: 30
    },
  ]);

  const [filters, setFilters] = useState({
    department: 'BSCS',
    semester: '5',
    section: 'A',
    subject: 'Database'
  });

  const [showAll, setShowAll] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Dummy data for dropdowns
  const departments = ['BSCS', 'BSIT', 'BSSE', 'MCS'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const sections = ['A', 'B', 'C', 'D'];
  const subjects = ['Database', 'OOP', 'Data Structures', 'Algorithms', 'Calculus'];

  // Filter function
  const filterStudents = () => {
    let result = students;
    
    if (!showAll) {
      result = result.filter(student => 
        student.department === filters.department &&
        student.semester === filters.semester &&
        student.section === filters.section &&
        student.subject === filters.subject
      );
    }
    
    // Filter for attendance <75%
    result = result.filter(student => student.attendancePercentage < 75);
    
    setFilteredStudents(result);
  };

  // Apply filters when component mounts or filters change
  useEffect(() => {
    filterStudents();
  }, [filters, showAll]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="teacher-dashboard">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="University Logo" />
        </div>
        <nav className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon">🏠</span>Back Dashboard
          </a>
        </nav>
      </div>
      <div className="main-content">
        <a href="/" className="logout-link">
          <span className="link-icon">🚪</span> Logout
        </a>
        <h1 className="page-titles">Short Attendance Report</h1>
        <div className="attendance-section">
          <h2 className="section-title">Students (Below 75% Attendance)</h2>
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="department">Department:</label>
              <select
                id="department"
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="semester">Semester:</label>
              <select
                id="semester"
                value={filters.semester}
                onChange={(e) => setFilters({...filters, semester: e.target.value})}
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="section">Section:</label>
              <select
                id="section"
                value={filters.section}
                onChange={(e) => setFilters({...filters, section: e.target.value})}
              >
                {sections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="subject">Subject:</label>
              <select
                id="subject"
                value={filters.subject}
                onChange={(e) => setFilters({...filters, subject: e.target.value})}
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="action-buttons">
            <button className="view-btn" onClick={() => setShowAll(false)}>
              <FaEye className="btn-icon" /> View
            </button>
            <button className="view-all-btn" onClick={() => setShowAll(true)}>
              <FaList className="btn-icon" /> View All
            </button>
            <button className="print-btn" onClick={handlePrint}>
              <FaPrint className="btn-icon" /> Print
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="attendance-section">
          <h2 className="section-title">
            {showAll ? 'All Students with Attendance Below 75%' : 
             `Filtered Students (${filters.department}, Sem ${filters.semester}, Sec ${filters.section}, ${filters.subject})`}
          </h2>
          {filteredStudents.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.regNo}</td>
                      <td>{student.name}</td>
                      <td>{student.department}</td>
                      <td>{student.semester}</td>
                      <td>{student.section}</td>
                      <td>{student.subject}</td>
                      <td className={student.attendancePercentage < 50 ? 'low-attendance' : 'moderate-attendance'}>
                        {student.attendancePercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="loading-text">No students found with attendance below 75%.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShortAttendance;