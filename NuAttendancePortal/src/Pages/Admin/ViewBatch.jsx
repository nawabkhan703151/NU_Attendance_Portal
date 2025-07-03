// src/Pages/Admin/ViewBatch.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewBatch.css'; // Make sure this file exists OR remove this line

function ViewBatch() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:4000/batch')
      .then((response) => {
        console.log('API Response:', response.data);
        const batchData = response.data.batches || [];
        setBatches(batchData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching batches:', error);
        setError('Failed to fetch batches. Please check the server or API endpoint.');
        setLoading(false);
      });
  }, []);

  // 🔁 Field getter to support different field casing
  const getField = (batch, field, fallback = 'N/A') => {
    const fieldNames = {
      b_name: ['b_name', 'batchName', 'name', 'batch_name', 'Batch_Name'],
      start_date: ['start_date', 'startDate', 'start', 'Start_Date'],
      end_date: ['end_date', 'endDate', 'end', 'End_Date'],
      sr_no: ['sr_no', 'serialNo', 'serial'],
    };

    const possibleFields = fieldNames[field] || [field];
    for (let possibleField of possibleFields) {
      if (batch[possibleField] !== undefined && batch[possibleField] !== null) {
        return batch[possibleField];
      }
    }
    return fallback;
  };

  // 📆 Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return !isNaN(date.getTime())
      ? date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : dateString; // fallback to raw if invalid
  };

  return (
    <div className="view-batch-container">
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

      <h1 className="page-titles">Batch</h1>
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      <div className="main-content">
        <div className="batch-info">
          <h2 className="section-title">Batch List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : batches.length === 0 ? (
            <p>No batches found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Batch Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch, index) => (
                    <tr key={batch._id || index}>
                      <td>{getField(batch, 'sr_no', index + 1)}</td>
                      <td>{getField(batch, 'b_name', 'N/A')}</td>
                      <td>{formatDate(getField(batch, 'start_date', ''))}</td>
                      <td>{formatDate(getField(batch, 'end_date', ''))}</td>
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

export default ViewBatch;
