import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaSave, FaArrowLeft, FaBook, FaList } from 'react-icons/fa';
import '../../Styles/Admin/AddCourse.css';

const MessagePopup = ({ isOpen, onClose, message, type }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{type === 'error' ? 'Oops!' : 'Success!'}</h2>
        <p className="modal-subtitle">{message}</p>
        <button className="modal-close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

const AddCourse = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setError('Only Excel files (.xlsx or .xls) are allowed');
        setFile(null);
        setFileSelected(false);
        return;
      }
      setFile(selectedFile);
      setFileSelected(true);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop().toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setError('Only Excel files (.xlsx or .xls) are allowed');
        return;
      }
      setFile(droppedFile);
      setFileSelected(true);
      setError('');
    }
  };

  const handleClick = () => fileInputRef.current.click();

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    setIsLoading(true);
    try  {
  const response = await axios.post(
    'http://localhost:4000/course/uploadCourses',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  const res = response.data;
  setSuccess(`Inserted = ${res.insertedCount}`);
  setError('');
} catch (err) {
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
  };

  return (
    <div className="add-student-container">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="NU Logo" />
        </div>
        <nav className="nav-list">
          <a href="/admin-dashboard" className="nav-link"><FaBook /> Dashboard</a>
          <a href="#" className="nav-link"><FaList /> Add Course</a>
        </nav>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <h2 className="section-title">Upload Course Excel File</h2>
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
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="file-input"
              ref={fileInputRef}
              hidden
            />
            <span className="file-status">{fileSelected ? file.name : 'No file selected'}</span>
          </div>

          {isLoading && <div className="loading-spinner">Uploading...</div>}

          <div className="form-actions">
            <button className="back-btn save-btn" onClick={handleUpload} disabled={isLoading}>
              <FaSave className="btn-icon" /> Save
            </button>
            <button className="back-btn" onClick={() => navigate('/admin-dashboard')} disabled={isLoading}>
              <FaArrowLeft className="btn-icon" /> Back
            </button>
          </div>
        </div>

        <MessagePopup isOpen={!!error} onClose={closePopup} message={error} type="error" />
        <MessagePopup isOpen={!!success} onClose={closePopup} message={success} type="success" />
      </div>
    </div>
  );
};

export default AddCourse;
