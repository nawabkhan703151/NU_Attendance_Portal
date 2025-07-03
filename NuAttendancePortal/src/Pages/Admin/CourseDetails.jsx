
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/CourseDetails.css';

const CourseDetails = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [courseData, setCourseData] = useState([]);

  // Fetch all unique programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await axios.get('http://localhost:4000/program');
        if (Array.isArray(res.data)) {
          const uniquePrograms = new Map();
          res.data.forEach(course => {
            const prog = course.program;
            if (prog && prog.p_id && prog.p_name) {
              uniquePrograms.set(prog.p_id.trim(), prog.p_name.trim());
            }
          });
          const programList = Array.from(uniquePrograms, ([p_id, p_name]) => ({ p_id, p_name }));
          setPrograms(programList);
        }
      } catch (error) {
        console.error('Error fetching programs:', error.message);
      }
    };
    fetchPrograms();
  }, []);

  // View courses for selected program
  const handleView = async () => {
    if (!selectedProgramId) {
      alert('Please select a program');
      return;
    }

    try {
      const res = await axios.get('http://localhost:4000/course/c', {
        params: { programId: selectedProgramId }
      });

      if (res.data.status && Array.isArray(res.data.data)) {
        setCourseData(res.data.data);
        
      } else {
        setCourseData([]);
        alert(res.data.message || 'No courses found');
      }
    } catch (error) {
      console.error('Error fetching filtered courses:', error.message);
      alert('Failed to fetch course data.');
    }
  };

  // View all courses
  const handleViewAll = async () => {
    try {
      const res = await axios.get('http://localhost:4000/course/c');

      if (res.data.status && Array.isArray(res.data.data)) {
        setCourseData(res.data.data);
        
      } else {
        setCourseData([]);
        alert(res.data.message || 'No courses found');
      }
    } catch (error) {
      console.error('Error fetching all courses:', error.message);
      alert('Failed to fetch course data.');
    }
  };

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
        <div className="page-titles">Course Details</div>
        <a href="/" className="logout-link">
          <span>Logout</span>
          <span className="link-icon">🚪</span>
        </a>

        <div className="attendance-section">
          <h2 className="section-title">Course Details</h2>

          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="program">Program Name</label>
              <select
                id="program"
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
              >
                <option value="">Select Program</option>
                {programs.map((prog, idx) => (
                  <option key={idx} value={prog.p_id}>
                    {prog.p_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="action-buttons">
              <button className="view-btns" onClick={handleView}>
                <span>View</span>
                <span className="btn-icon">👁️</span>
              </button>
              <button className="view-btns" onClick={handleViewAll}>
                <span>View All</span>
                <span className="btn-icon">👁️</span>
              </button>
            </div>
          </div>
        </div>

        {courseData.length > 0 && (
          <div className="attendance-section">
            <h2 className="section-title">
              Course List ({selectedProgramId || 'All Programs'})
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Course Title</th>
                    <th>Category</th>
                    <th>Credit Hours</th>
                    <th>Program Name</th>
                  </tr>
                </thead>
                <tbody>
                  {courseData.map((course, index) => (
                    <tr key={course._id || index}>
                      <td>{index + 1}</td>
                      <td>{course.c_title}</td>
                      <td>{course.c_category}</td>
                      <td>{course.cr_hours}</td>
                      <td>{course.program?.p_name?.trim() || 'N/A'}</td>
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

export default CourseDetails;
