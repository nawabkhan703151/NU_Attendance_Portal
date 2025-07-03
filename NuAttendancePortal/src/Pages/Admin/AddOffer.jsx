import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaSave, FaArrowLeft, FaBook, FaList } from 'react-icons/fa';
import '../../Styles/Admin/AddOffer.css';

const MessagePopup = ({ isOpen, onClose, message, type }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{type === 'error' ? 'Oops!' : 'Success!'}</h2>
        <p className="modal-subtitle" style={{ whiteSpace: 'pre-line' }}>{message}</p>
        <button className="modal-close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

const AddOffer = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState([]);

  const validateFile = (file) => {
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setError('Only Excel files (.xlsx or .xls) are allowed');
      setFile(null);
      setFileSelected(false);
    } else {
      setFile(file);
      setFileSelected(true);
      setError('');
    }
  };

  const handleFileChange = (e) => validateFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateFile(e.dataTransfer.files[0]);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleClick = () => fileInputRef.current.click();

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    setIsLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:4000/offer/uploadOffersExcel',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const res = response.data;
      const results = res.results || [];
      const inserted = res.insertedCount || results.filter(r => r.status === 'success' || r.status === 'validated').length;
      const failed = results.filter(r => r.status === 'failed').length;

      setResults(results);
      setFile(null);
      setFileSelected(false);

      if (inserted > 0 || failed > 0) {
        setSuccess(`Upload Completed!\nInserted: ${inserted}, Failed: ${failed}`);
        setError('');
      } else {
        setError('No valid offers inserted.');
        setSuccess('');
      }

    } catch (err) {
      console.error('Upload error:', err);
      if (err.response?.data?.errors?.length) {
        const formatted = err.response.data.errors
          .map(e => `Row ${e.row}: ${e.error}`)
          .join('\n');
        setError(formatted);
      } else {
        setError(err.response?.data?.message || 'Upload failed.');
      }
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setError('');
    setSuccess('');
    setResults([]);
  };

  return (
    <div className="add-student-container">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <nav className="nav-list">
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon"><FaBook /></span> Dashboard
          </a>
          <a href="/admin/add-offer" className="nav-link">
            <span className="link-icon"><FaList /></span> Add Offer
          </a>
        </nav>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <h2 className="section-title">Upload Offer Excel File</h2>

          <div
            className={`file-drop-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <FaUpload className="upload-icon" />
            <p>{isDragging ? 'Drop the file here' : 'Drag & drop Excel file or click to select'}</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="file-input"
            />
            <span className="file-status">{fileSelected ? file.name : 'No file selected'}</span>
          </div>

          {isLoading && <div className="loading-spinner">Uploading...</div>}

          <div className="form-actions">
            <button onClick={handleUpload} className="back-btn save-btn" disabled={isLoading}>
              <FaSave className="btn-icon" /> Save
            </button>
            <button onClick={() => navigate('/admin-dashboard')} className="back-btn" disabled={isLoading}>
              <FaArrowLeft className="btn-icon" /> Back
            </button>
          </div>

          {results.length > 0 && (
            <div className="upload-results">
              <h3>Upload Results:</h3>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Offer ID</th>
                    <th>Status</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{res.offer_id || '-'}</td>
                      <td>{res.status}</td>
                      <td>{res.error || 'Inserted successfully'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <MessagePopup isOpen={!!error} onClose={closePopup} message={error} type="error" />
        <MessagePopup isOpen={!!success} onClose={closePopup} message={success} type="success" />
      </div>
    </div>
  );
};

export default AddOffer;
