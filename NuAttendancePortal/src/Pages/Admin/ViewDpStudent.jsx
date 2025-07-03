// import { useEffect, useState } from 'react';
// import { FaEye, FaList } from 'react-icons/fa';
// import axios from 'axios';
// import '../../Styles/Admin/ViewDpStudent.css';

// const ViewDpStudent = () => {
//   const [programs, setPrograms] = useState([]);
//   const [sessions, setSessions] = useState([]);
//   const [subjects, setSubjects] = useState([]);
//   const [sections, setSections] = useState([]);
//   const [students, setStudents] = useState([]);

//   const [programId, setProgramId] = useState('');
//   const [session, setSession] = useState('');
//   const [section, setSection] = useState('');
//   const [subject, setSubject] = useState('');

//   const [showFiltered, setShowFiltered] = useState(false);
//   const [showAll, setShowAll] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   useEffect(() => {
//     axios.get('http://localhost:4000/program/')
//       .then(res => {
//         const courses = res.data;
//         const uniquePrograms = [];
//         const programSet = new Set();

//         courses.forEach(course => {
//           const program = course.program;
//           if (!programSet.has(program.p_id)) {
//             programSet.add(program.p_id);
//             uniquePrograms.push({ p_id: program.p_id, p_name: program.p_name });
//           }
//         });

//         setPrograms(uniquePrograms);
//       })
//       .catch(err => {
//         console.error('Program load error:', err);
//         setErrorMessage('Failed to load programs.');
//       });

//     axios.get('http://localhost:4000/session')
//       .then(res => setSessions(res.data))
//       .catch(err => {
//         console.error('Session load error:', err);
//         setErrorMessage('Failed to load sessions.');
//       });
//   }, []);

//   useEffect(() => {
//     axios.get('http://localhost:4000/student')
//       .then(res => {
//         const studentsData = res.data || [];
//         const sectionSet = new Set(studentsData.map(s => s.section_name).filter(Boolean));
//         setSections(Array.from(sectionSet));
//       })
//       .catch(err => {
//         console.error('Section dropdown load error:', err);
//         setSections([]);
//       });
//   }, []);

//   useEffect(() => {     
//     if (programId) {
//       setIsLoading(true);
//       axios.get(`http://localhost:4000/program/c?programId=${programId}`)
//         .then(res => {
//           const courseTitles = res.data.data?.map(course => course.c_title) || [];
//           setSubjects(courseTitles);
//           setSubject(courseTitles[0] || '');
//         })
//         .catch(err => {
//           console.error('Subject load error:', err);
//           setSubjects([]);
//           setSubject('');
//           setErrorMessage('Failed to load subjects for the selected program.');
//         })
//         .finally(() => setIsLoading(false));
//     } else {
//       setSubjects([]);
//       setSubject('');
//     }
//   }, [programId]);

//   useEffect(() => {
//     setSection('');
//     setStudents([]);
//     setShowFiltered(false);
//     setShowAll(false);
//     setErrorMessage('');
//   }, [programId, session]);

//   const handleViewAll = () => {
//     setIsLoading(true);
//     axios.get('http://localhost:4000/student/all')
//       .then(res => {
//         setStudents(res.data.data || []);
//         setShowFiltered(false);
//         setShowAll(true);
//         setErrorMessage('');
//       })
//       .catch(err => {
//         console.error('All student fetch error:', err);
//         setStudents([]);
//         setShowAll(true);
//         setShowFiltered(false);
//         setErrorMessage('Failed to fetch all students.');
//       })
//       .finally(() => setIsLoading(false));
//   };

//   const handleView = () => {
//     if (!programId || !session || !subject) {
//       setErrorMessage('Please select a program, session, and subject.');
//       return;
//     }
//     setIsLoading(true);
//     const selectedProgram = programs.find(p => p.p_id === programId)?.p_name || '';
//     axios.get('http://localhost:4000/student/filter', {
//       params: { program: selectedProgram, session, section, subject }
//     })
//       .then(res => {
//         setStudents(res.data.data || []);
//         setShowFiltered(true);
//         setShowAll(false);
//         setErrorMessage('');
//       })
//       .catch(err => {
//         console.error('Filter error:', err);
//         setStudents([]);
//         setShowFiltered(true);
//         setShowAll(false);
//         setErrorMessage(err.response?.data?.message || 'No students found for the selected filters.');
//       })
//       .finally(() => setIsLoading(false));
//   };

//   return (
//     <div className="teacher-dashboard">
//       <div className="sidebar">
//         <div className="logo-container">
//           <img src="/logo.png" className="logo" alt="University Logo" />
//         </div>
//         <nav className="nav-list">
//           <a href="/admin-dashboard" className="nav-link">
//             <span className="link-icon">🏠</span>Back Dashboard
//           </a>
//         </nav>
//       </div>

//       <div className="main-content">
//         <a href="/" className="logout-link">
//           <span className="link-icon">🚪</span> Logout
//         </a>
//         <h1 className="page-titles">NU Attendance Portal</h1>

//         <div className="attendance-section">
//           <h2 className="section-title">Filter Students</h2>
//           <div className="filter-container">
//             <div className="filter-group">
//               <label>Program:</label>
//               <select value={programId} onChange={e => setProgramId(e.target.value)}>
//                 <option value="">Select Program</option>
//                 {programs.map(p => (
//                   <option key={p.p_id} value={p.p_id}>{p.p_name}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="filter-group">
//               <label>Session:</label>
//               <select value={session} onChange={e => setSession(e.target.value)}>
//                 <option value="">Select Session</option>
//                 {sessions.map((s, i) => (
//                   <option key={i} value={s.session_name}>{s.session_name}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="filter-group">
//               <label>Section:</label>
//               <select value={section} onChange={e => setSection(e.target.value)}>
//                 <option value="">Select Section</option>
//                 {sections.map((sec, i) => (
//                   <option key={i} value={sec}>{sec}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="filter-group">
//               <label>Subject:</label>
//               <select value={subject} onChange={e => setSubject(e.target.value)}>
//                 <option value="">Select Subject</option>
//                 {subjects.map((subj, i) => (
//                   <option key={i} value={subj}>{subj}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           <div className="action-buttons">
//             <button className="view-btn" onClick={handleView} disabled={isLoading}>
//               <FaEye className="btn-icon" /> View
//             </button>
//             <button className="view-all-btn" onClick={handleViewAll} disabled={isLoading}>
//               <FaList className="btn-icon" /> View All
//             </button>
//           </div>
//           {errorMessage && <p className="error-text">{errorMessage}</p>}
//         </div>

//         {isLoading && <p className="loading-text">Loading...</p>}

//         {showFiltered && !isLoading && (
//           <div className="attendance-section">
//             <h2 className="section-title">Filtered Students</h2>
//             {students.length > 0 ? (
//               <div className="table-container">
//                 <table className="data-table">
//                   <thead>
//                     <tr>
//                       <th>Sr No</th>
//                       <th>Reg No</th>
//                       <th>Name</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {students.map((s, i) => (
//                       <tr key={i}>
//                         <td>{i + 1}</td>
//                         <td>{s.st_id}</td>
//                         <td>{s.userId?.username || 'N/A'}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="loading-text">No students found for this filter.</p>
//             )}
//           </div>
//         )}

//         {showAll && !isLoading && (
//           <div className="attendance-section">
//             <h2 className="section-title">All Students</h2>
//             <div className="table-container">
//               <table className="data-table">
//                 <thead>
//                   <tr>
//                     <th>Sr No</th>
//                     <th>Reg No</th>
//                     <th>Name</th>
//                     <th>Program</th>
//                     <th>Session</th>
//                     <th>Section</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {students.map((s, i) => (
//                     <tr key={i}>
//                       <td>{s.sr_no}</td>
//                       <td>{s.reg_no}</td>
//                       <td>{s.name}</td>
//                       <td>{s.program_name}</td>
//                       <td>{s.session_name}</td>
//                       <td>{s.section_name}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ViewDpStudent; 

import { useEffect, useState } from 'react';
import { FaEye, FaList } from 'react-icons/fa';
import axios from 'axios';
import '../../Styles/Admin/ViewDpStudent.css';

const ViewDpStudent = () => {
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [programId, setProgramId] = useState('');
  const [session, setSession] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');

  const [showFiltered, setShowFiltered] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:4000/program')
      .then(res => {
        console.log('API Response:', res.data); // Debugging
        const courses = res.data || [];
        const uniquePrograms = [];
        const programSet = new Set();

        courses.forEach(course => {
          const program = course.program;
          if (program && program.p_id && !programSet.has(program.p_id)) {
            programSet.add(program.p_id);
            uniquePrograms.push({ p_id: program.p_id, p_name: program.p_name || 'Unknown' });
          }
        });

        setPrograms(uniquePrograms);
      })
      .catch(err => {
        console.error('Program load error:', err);
        setErrorMessage('Failed to load programs.');
        setPrograms([]);
      });

    axios.get('http://localhost:4000/session')
      .then(res => setSessions(res.data || []))
      .catch(err => {
        console.error('Session load error:', err);
        setErrorMessage('Failed to load sessions.');
        setSessions([]);
      });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:4000/student')
      .then(res => {
        const studentsData = res.data || [];
        const sectionSet = new Set(studentsData.map(s => s.section_name).filter(Boolean));
        setSections(Array.from(sectionSet));
      })
      .catch(err => {
        console.error('Section dropdown load error:', err);
        setSections([]);
        setErrorMessage('Failed to load sections.');
      });
  }, []);

  useEffect(() => {     
    if (programId) {
      setIsLoading(true);
      axios.get(`http://localhost:4000/course/c?programId=${programId}`)
        .then(res => {
          const courseTitles = res.data.data?.map(course => course.c_title) || [];
          setSubjects(courseTitles);
          setSubject(courseTitles[0] || '');
        })
        .catch(err => {
          console.error('Subject load error:', err);
          setSubjects([]);
          setSubject('');
          setErrorMessage('Failed to load subjects for the selected program.');
        })
        .finally(() => setIsLoading(false));
    } else {
      setSubjects([]);
      setSubject('');
    }
  }, [programId]);

  useEffect(() => {
    setSection('');
    setStudents([]);
    setShowFiltered(false);
    setShowAll(false);
    setErrorMessage('');
  }, [programId, session]);

  const handleViewAll = () => {
    setIsLoading(true);
    axios.get('http://localhost:4000/student/all')
      .then(res => {
        setStudents(res.data.data || []);
        setShowFiltered(false);
        setShowAll(true);
        setErrorMessage('');
      })
      .catch(err => {
        console.error('All student fetch error:', err);
        setStudents([]);
        setShowAll(true);
        setShowFiltered(false);
        setErrorMessage('Failed to fetch all students.');
      })
      .finally(() => setIsLoading(false));
  };

  const handleView = () => {
    if (!programId || !session || !subject) {
      setErrorMessage('Please select a program, session, and subject.');
      return;
    }
    setIsLoading(true);
    const selectedProgram = programs.find(p => p.p_id === programId)?.p_name || '';
    axios.get('http://localhost:4000/student/filter', {
      params: { program: selectedProgram, session, section, subject }
    })
      .then(res => {
        setStudents(res.data.data || []);
        setShowFiltered(true);
        setShowAll(false);
        setErrorMessage('');
      })
      .catch(err => {
        console.error('Filter error:', err);
        setStudents([]);
        setShowFiltered(true);
        setShowAll(false);
        setErrorMessage(err.response?.data?.message || 'No students found for the selected filters.');
      })
      .finally(() => setIsLoading(false));
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
        <h1 className="page-titles">NU Attendance Portal</h1>

        <div className="attendance-section">
          <h2 className="section-title">Filter Students</h2>
          <div className="filter-container">
            <div className="filter-group">
              <label>Program:</label>
              <select value={programId} onChange={e => setProgramId(e.target.value)}>
                <option value="">Select Program</option>
                {programs.map(p => (
                  <option key={p.p_id} value={p.p_id}>{p.p_name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Session:</label>
              <select value={session} onChange={e => setSession(e.target.value)}>
                <option value="">Select Session</option>
                {sessions.map((s, i) => (
                  <option key={i} value={s.session_name}>{s.session_name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Section:</label>
              <select value={section} onChange={e => setSection(e.target.value)}>
                <option value="">Select Section</option>
                {sections.map((sec, i) => (
                  <option key={i} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Subject:</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map((subj, i) => (
                  <option key={i} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="action-buttons">
            <button className="view-btn" onClick={handleView} disabled={isLoading}>
              <FaEye className="btn-icon" /> View
            </button>
            <button className="view-all-btn" onClick={handleViewAll} disabled={isLoading}>
              <FaList className="btn-icon" /> View All
            </button>
          </div>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </div>

        {isLoading && <p className="loading-text">Loading...</p>}

        {showFiltered && !isLoading && (
          <div className="attendance-section">
            <h2 className="section-title">Filtered Students</h2>
            {students.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sr No</th>
                      <th>Reg No</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{s.st_id}</td>
                        <td>{s.userId?.username || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="loading-text">No students found for this filter.</p>
            )}
          </div>
        )}

        {showAll && !isLoading && (
          <div className="attendance-section">
            <h2 className="section-title">All Students</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Program</th>
                    <th>Session</th>
                    <th>Section</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i}>
                      <td>{s.sr_no || i + 1}</td>
                      <td>{s.reg_no || s.st_id || 'N/A'}</td>
                      <td>{s.name || s.userId?.username || 'N/A'}</td>
                      <td>{s.program_name || 'N/A'}</td>
                      <td>{s.session_name || 'N/A'}</td>
                      <td>{s.section_name || 'N/A'}</td>
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

export default ViewDpStudent;
