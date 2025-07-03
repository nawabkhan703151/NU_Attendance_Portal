import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaSave, FaArrowLeft, FaBook, FaList ,} from 'react-icons/fa';
import '../../Styles/Admin/AddEnrollDetails.css';

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

const AddDepartment = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const validateFile = (file) => {
    if (!file) return;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setError('Only Excel files (.xlsx or .xls) are allowed');
      setFile(null);
      setFileSelected(false);
    } else {
      setFile(file);
      setFileSelected(true);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('excelFile', file);

      const response = await axios.post(
        'http://localhost:4000/department/uploadDepartments',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const { insertedCount, skippedCount, failedCount } = response.data;

      setSuccess(
        `Upload Completed!\nInserted: ${insertedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`
      );
      setError('');
      setFile(null);
      setFileSelected(false);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to upload. Please try again.';
      setError(errorMsg);
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => fileInputRef.current.click();
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
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
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon"><FaBook /></span> Dashboard
          </a>
          <a href="#" className="nav-link">
            <span className="link-icon"><FaList /></span> Add Department
          </a>
        </nav>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <h2 className="section-title">Upload Department Excel File</h2>
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
              id="file-upload"
              ref={fileInputRef}
            />
            <span className="file-status">
              {fileSelected ? file.name : 'No file selected'}
            </span>
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
        </div>

        <MessagePopup
          isOpen={!!error}
          onClose={closePopup}
          message={error}
          type="error"
        />
        <MessagePopup
          isOpen={!!success}
          onClose={closePopup}
          message={success}
          type="success"
        />
      </div>
    </div>
  );
};

export default AddDepartment;
