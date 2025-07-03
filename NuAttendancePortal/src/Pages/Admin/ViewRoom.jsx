import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewRoom.css';

function ViewRoom() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:4000/room')
      .then((response) => {
        setRooms(response.data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
        setError('Failed to fetch rooms. Please check the server or API endpoint.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="view-batch-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <div className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon">🏠</span> Back to Dashboard
          </a>
        </div>
      </div>

      {/* Page Title */}
      <h1 className="page-titles">Rooms</h1>

      {/* Logout */}
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      {/* Main Content */}
      <div className="main-content">
        <div className="batch-info">
          <h2 className="section-title">Room List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : rooms.length === 0 ? (
            <p>No Rooms found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Room ID</th>
                    <th>Room Name</th>
                    <th>Room Type</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, index) => (
                    <tr key={room._id || index}>
                      <td>{room.sr_no}</td>
                      <td>{room.roomid}</td>
                      <td>{room.RoomName}</td>
                      <td>{room.RoomType}</td>
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

export default ViewRoom;
