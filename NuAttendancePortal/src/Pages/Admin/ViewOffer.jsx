import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Admin/ViewOffer.css';

function ViewOffer() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:4000/offer/')
      .then((response) => {
        console.log('API Response:', response.data);
        setOffers(response.data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching offers:', error);
        setError('Failed to fetch offers. Please check the server or API endpoint.');
        setLoading(false);
      });
  }, []);

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

      <h1 className="page-titles">Offers</h1>
      <a href="/" className="logout-link">
        <span className="link-icon">🚪</span> Logout
      </a>

      <div className="main-content">
        <div className="batch-info">
          <h2 className="section-title">Offer List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : offers.length === 0 ? (
            <p>No offers found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Offer ID</th>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Session Name</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer, index) => (
                    <tr key={index}>
                      <td>{offer.sr_no}</td>
                      <td>{offer.offer_id}</td>
                      <td>{offer.c_code}</td>
                      <td>{offer.course_name}</td>
                      <td>{offer.session_name}</td>
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

export default ViewOffer;
