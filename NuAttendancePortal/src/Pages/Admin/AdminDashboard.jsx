import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserPlus,
  FaUser,
  FaChalkboardTeacher,
  FaList,
  FaBook,
  FaSignOutAlt,
  FaAddressBook
} from "react-icons/fa";
import { FcDepartment } from "react-icons/fc";
import { PiStudentFill } from "react-icons/pi";
import { MdBatchPrediction, MdLocalOffer } from "react-icons/md";
import { SiSessionize,SiGoogleclassroom } from "react-icons/si";
import { TfiCommentAlt } from "react-icons/tfi";
import { ImAlarm } from "react-icons/im";
import { FaArrowDownWideShort } from "react-icons/fa6";
import "../../Styles/Admin/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Fetch user data from localStorage and protect route
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!token || !storedUser || storedUser.role !== "admin") {
      navigate("/"); // Redirect to login if not authenticated or not an admin
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) {
    return null; // Render nothing while checking authentication
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <nav className="nav-list">
          <a href="/admin-dashboard" className="nav-link active">
            <span className="link-icon">
              <FaBook />
            </span>
            Admin Dashboard
          </a>
          <button className="logout-btn sidebar-logout" onClick={handleLogout}>
            <span className="link-icon">
              <FaSignOutAlt />
            </span>{" "}
            Log Out
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <div className="title-section">
            <h1 className="portal-title">NU Attendance Portal</h1>
            <p className="admin-name">Name: {user.username}</p>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="button-grid">
            {/* Combined Add/View Student Card */}
            <div className="button-card">
              <FaUser className="card-icon" />
              <p>Student</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-student")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-dp-student/:course")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Teacher Card */}
            <div className="button-card">
              <FaChalkboardTeacher className="card-icon" />
              <p>Teacher</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-teacher")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-teacher")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Attendance Card (View Only) */}
            <div className="button-card">
              <FaList className="card-icon" />
              <p>View Attendance</p>
              <div className="button-group">
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/admin-view-attendance/:course")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Short Attendance Card (View Only) */}
            <div className="button-card">
              <FaArrowDownWideShort className="card-icon" />
              <p>Short Attendance</p>
              <div className="button-group">
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/short-attendance")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Enrollments Card */}
            <div className="button-card">
              <FaAddressBook className="card-icon" />
              <p>Enrollments</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-enroll-details")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-enrollment-details/:course")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Courses Card */}
            <div className="button-card">
              <FaBook className="card-icon" />
              <p>Courses</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-course-details")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/course-details/:course")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Department Card */}
            <div className="button-card">
              <FcDepartment className="card-icon" />
              <p>Department</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-department")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-department")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Program Card */}
            <div className="button-card">
              <PiStudentFill  className="card-icon" />
              <p>Program</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-program")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-program")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Batch Card */}
            <div className="button-card">
              <MdBatchPrediction  className="card-icon" />
              <p>Batch</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-batch")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-batch")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Session Card */}
            <div className="button-card">
              <SiSessionize className="card-icon" />
              <p>Session</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-session")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-session")}
                >
                  VIEW
                </button>
              </div>
            </div>
            {/* Combined Add/View Offer Card */}
            <div className="button-card">
              <MdLocalOffer className="card-icon" />
              <p>Offer</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-offer")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-offer")}
                >
                  VIEW
                </button>
              </div>
            </div>

            {/* Combined Add/Room Card */}
            <div className="button-card">
              <SiGoogleclassroom className="card-icon" />
              <p>Room</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-room")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-room")}
                >
                  VIEW
                </button>
              </div>
            </div>

            {/* Combined Add/Allocation Card */}
            <div className="button-card">
              <TfiCommentAlt  className="card-icon" />
              <p>Allocation</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-allocation")}
                >
                  ADD
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-allocation")}
                >
                  VIEW
                </button>
              </div>
            </div>

            {/* Add Timetable Card */}
            <div className="button-card">
              <ImAlarm  className="card-icon" />
              <p>Timetable</p>
              <div className="button-group">
                <button
                  className="action-btn add-btn"
                  onClick={() => navigate("/add-timetable")}
                >
                  ADD
                </button>
                  <button
                  className="action-btn view-btn"
                  onClick={() => navigate("/view-timetable")}
                >
                  VIEW
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
