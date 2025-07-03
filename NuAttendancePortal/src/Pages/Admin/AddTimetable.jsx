import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaSave, FaArrowLeft, FaBook, FaList } from 'react-icons/fa';
import '../../Styles/Admin/AddTimetable.css';

// ✅ Room-style message popup
const MessagePopup = ({ isOpen, onClose, message, type }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{type === 'error' ? 'Oops!' : 'Upload Result'}</h2>
        <p className="modal-subtitle">{message}</p>
        <button className="modal-close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

const AddTimetable = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  const [results, setResults] = useState([]);

  const validateFile = (file) => {
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setPopupMessage('Only Excel files (.xlsx or .xls) are allowed');
      setPopupType('error');
      setPopupOpen(true);
      setFile(null);
      setFileSelected(false);
    } else {
      setFile(file);
      setFileSelected(true);
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
      setPopupMessage('Please select a file to upload');
      setPopupType('error');
      setPopupOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('excelFile', file);

      const res = await axios.post('http://localhost:4000/timetable/uploadTimetableExcel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { insertedCount = 0, updatedCount = 0, failedCount = 0 } = res.data;

      const summaryMessage = `Upload successful!\nInserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`;
      setPopupMessage(summaryMessage);
      setPopupType('success');
      setPopupOpen(true);

      setResults([]);
      setFile(null);
      setFileSelected(false);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.message || 'Upload failed. Try again.';
      const serverErrors = err.response?.data?.errors || [];

      setResults(serverErrors);
      setPopupMessage(msg);
      setPopupType('error');
      setPopupOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setPopupOpen(false);
    setPopupMessage('');
    setPopupType('success');
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
          <a href="/admin/add-room" className="nav-link">
            <span className="link-icon"><FaList /></span> Add TimeTable
          </a>
        </nav>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <h2 className="section-title">Upload TimeTable Excel File</h2>

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
              <h3>Validation Errors:</h3>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Row</th>
                    <th>Error Message</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{res.row || 'N/A'}</td>
                      <td>{res.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ Unified popup for success/error */}
        <MessagePopup isOpen={popupOpen} onClose={closePopup} message={popupMessage} type={popupType} />
      </div>
    </div>
  );
};

export default AddTimetable;
