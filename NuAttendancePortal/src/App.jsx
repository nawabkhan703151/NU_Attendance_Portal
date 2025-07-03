// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './Pages/login/LoginPage';
import StudentDashboard from './Pages/Student/StudentDashboard';
import TeacherDashboard from './Pages/Teacher/TeacherDashboard';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import ViewStudent from './Pages/Student/ViewStudent'; // Importing ViewStudent
import AddStudent from './Pages/Admin/AddStudent';
import AddTeacher from './Pages/Admin/AddTeacher';
import AddEnrollDetails from './Pages/Admin/AddEnrollDetails';
import AddCourse from './Pages/Admin/AddCourse';
import MarkAttendance from './Pages/Teacher/MarkAttendance';
import ViewAttendance from './Pages/Teacher/ViewAttendance';
import ViewDpStudent from './Pages/Admin/ViewDpStudent';
import ViewTeacher from './Pages/Admin/ViewTeacher';  
import AdminViewAttendance from './Pages/Admin/AdminViewAttendance';
import ShortAttendance from './Pages/Admin/ShortAttendance';
import ViewEnrollment from './Pages/Admin/ViewEnrollment';
import CourseDetails from './Pages/Admin/CourseDetails';
import ViewDepartment from './Pages/Admin/ViewDepartment';
import AddDepartment from './Pages/Admin/AddDepartment';
import AddProgram from './Pages/Admin/AddProgram';
import ViewProgram from './Pages/Admin/ViewProgram';
import AddBatch from './Pages/Admin/AddBatch';
import ViewBatch from './Pages/Admin/ViewBatch'; 
import AddSession from './Pages/Admin/AddSession';
import ViewSession from './Pages/Admin/ViewSession'; 
import AddOffer from './Pages/Admin/AddOffer';
import ViewOffer from './Pages/Admin/ViewOffer';
import AddRoom from './Pages/Admin/AddRoom';
import ViewRoom from './Pages/Admin/ViewRoom';
import AddAllocation from './Pages/Admin/AddAllocation';
import ViewAllocation from './Pages/Admin/ViewAllocation';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/admin-dashboard" element={< AdminDashboard />} />
        <Route path="/view-student/:course" element={<ViewStudent />} />
        <Route path="/add-student" element={<AddStudent />} />
        <Route path="/add-teacher" element={<AddTeacher/>} />
        <Route path="/add-enroll-details" element={<AddEnrollDetails/>} />
        <Route path="/add-course-details" element={<AddCourse/>} />
        <Route path="/mark-attendance/:course" element={<MarkAttendance/>} />
        <Route path="/view-attendance/:course" element={<ViewAttendance/>} />
        <Route path="/view-dp-student/:course" element={<ViewDpStudent/>} />
        <Route path="/view-teacher" element={<ViewTeacher/>} />
        <Route path="/admin-view-attendance/:course" element={<AdminViewAttendance />} />
        <Route path="/short-attendance" element={<ShortAttendance />} />
        <Route path="/view-enrollment-details/:course" element={<ViewEnrollment />} />
        <Route path="/course-details/:course" element={<CourseDetails />} />
        <Route path="/view-department" element={<ViewDepartment />} />
        <Route path="/add-department" element={<AddDepartment />} />
        <Route path="/add-program" element={<AddProgram/>} />
        <Route path="/view-program" element={<ViewProgram />} />
        <Route path="/add-batch" element={<AddBatch />} />
        <Route path="/view-batch" element={<ViewBatch />} />
        <Route path="/add-session" element={<AddSession />} />
        <Route path="/view-session" element={<ViewSession />} />
        <Route path="/add-offer" element={<AddOffer/>} />
        <Route path="/view-offer" element={<ViewOffer/>} />
        <Route path="/add-room" element={<AddRoom/>} />
        <Route path="/view-room" element={<ViewRoom/>} />
        <Route path="/add-allocation" element={<AddAllocation/>} />
        <Route path="/view-allocation" element={<ViewAllocation/>} />
        

      </Routes>
    </Router>
  );
}

export default App;