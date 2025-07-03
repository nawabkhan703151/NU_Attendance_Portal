import React, { useState, useEffect } from 'react';
import '../../Styles/Admin/ViewEnrollment.css';

const ViewEnrollment = () => {
  const departments = ["BSCS", "BS English", "BS Nursing", "BS Psychology", "BS Mathematics"];
  const sections = ["A", "B", "C", "D", "E"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const subjectsByDepartment = {
    BSCS: ["Database", "Algorithms", "Operating Systems", "Web Development", "AI"],
    "BS English": ["Literature", "Linguistics", "Creative Writing", "Poetry", "Drama"],
    "BS Nursing": ["Anatomy", "Pharmacology", "Nursing Ethics", "Clinical Practice", "Pathology"],
    "BS Psychology": ["Cognitive Psychology", "Behavioral Studies", "Statistics", "Counseling", "Neuropsychology"],
    "BS Mathematics": ["Calculus", "Linear Algebra", "Statistics", "Number Theory", "Differential Equations"]
  };

  const sampleData = [
    { id: 1, name: "Abdul Malik", course: "Database", section: "A", department: "BSCS", semester: 2 },
    { id: 2, name: "Daniel Khan", course: "Database", section: "A", department: "BSCS", semester: 2 },
    { id: 3, name: "Jamshed Khan", course: "Database", section: "A", department: "BSCS", semester: 2 },
    { id: 4, name: "Sarah Ahmed", course: "Literature", section: "B", department: "BS English", semester: 3 },
    { id: 5, name: "Ayesha Noor", course: "Anatomy", section: "C", department: "BS Nursing", semester: 4 },
  ];

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [filteredData, setFilteredData] = useState([]); // Initialize empty to hide table initially

  const handleFilter = () => {
    let filtered = sampleData;

    if (selectedDepartment) {
      filtered = filtered.filter(student => student.department === selectedDepartment);
    }
    if (selectedSemester) {
      filtered = filtered.filter(student => student.semester === parseInt(selectedSemester));
    }
    if (selectedSection) {
      filtered = filtered.filter(student => student.section === selectedSection);
    }
    if (selectedSubject) {
      filtered = filtered.filter(student => student.course === selectedSubject);
    }

    // If no matching data, show all data
    setFilteredData(filtered.length > 0 ? filtered : sampleData);
  };

  useEffect(() => {
    // Clear filtered data when filters change to ensure table is hidden until View is clicked
    setFilteredData([]);
  }, [selectedDepartment, selectedSemester, selectedSection, selectedSubject]);

  return (
    <div className="teacher-dashboard">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" alt="University Logo" className="logo" />
        </div>
        <nav className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon">🏠</span> Back Dashboard
          </a>
        </nav>
      </div>
      <div className="main-content">
        <div className="page-titles">Attendance Portal</div>
        <a href="/admin-dashboard" className="logout-link">
          <span>Logout</span>
          <span className="link-icon">🚪</span>
        </a>

        <div className="attendance-section">
          <h2 className="section-title">Student Enrollment</h2>

          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedSubject("");
                }}
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="semester">Semester</label>
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                {semesters.map((sem, index) => (
                  <option key={index} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="section">Section</label>
              <select
                id="section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {sections.map((sec, index) => (
                  <option key={index} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedDepartment}
              >
                <option value="">Select Subject</option>
                {selectedDepartment &&
                  subjectsByDepartment[selectedDepartment].map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
              </select>
            </div>

            <div className="action-buttons">
              <button className="view-btns" onClick={handleFilter}>
                <span>View</span>
                <span className="btn-icon">👁️</span>
              </button>
            </div>
          </div>
        </div>

        {filteredData.length > 0 && (
          <div className="attendance-section">
            <h2 className="section-title">
              Enrollment ({selectedDepartment || 'All'}, Semester {selectedSemester || 'All'}, Section {selectedSection || 'All'}, {selectedSubject || 'All'})
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Department</th>
                    <th>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.course}</td>
                      <td>{student.section}</td>
                      <td>{student.department}</td>
                      <td>{student.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewEnrollment;