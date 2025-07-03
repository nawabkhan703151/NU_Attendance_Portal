import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaSave, FaArrowLeft, FaBook, FaList } from 'react-icons/fa';
import '../../Styles/Admin/AddTeacher.css';

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

const AddTeacher = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const resetFileInput = () => {
    setFile(null);
    setFileSelected(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const validateFile = (fileToValidate) => {
    const fileExtension = fileToValidate.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      setError('Only Excel files (.xlsx or .xls) are allowed');
      resetFileInput();
      return false;
    }
    if (fileToValidate.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      resetFileInput();
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
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
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
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
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await axios.post(
        'http://localhost:4000/adminregisterteacher',
        formData,
        {
          // Uncomment and update if your API requires auth
          // headers: {
          //   Authorization: `Bearer ${localStorage.getItem('token')}`,
          //   'Content-Type': 'multipart/form-data',
          // },
        }
      );
      const { results } = response.data;
      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.length - successCount;
      setSuccess(`Uploaded: ${successCount} added, ${failedCount} failed.`);
      setError('');
      resetFileInput();
    } catch (err) {
      console.error(err);
      setError('Error uploading file. Please check the format or try again.');
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
          <a href="/admin-dashboard" className="nav-link">
            <span className="link-icon"><FaBook /></span> Dashboard
          </a>
          <a href="#" className="nav-link">
            <span className="link-icon"><FaList /></span> Add Teacher
          </a>
        </nav>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <h2 className="section-title">Upload Teacher Excel File</h2>
          <div
            className={`file-drop-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <FaUpload className="upload-icon" />
            <p>{isDragging ? 'Drop the file here' : 'Drag & drop Excel file or click to select'}</p>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="file-input"
              ref={fileInputRef}
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
        </div>

        <MessagePopup isOpen={!!error} onClose={closePopup} message={error} type="error" />
        <MessagePopup isOpen={!!success} onClose={closePopup} message={success} type="success" />
      </div>
    </div>
  );
};

export default AddTeacher;
