import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FaUpload, FaSave, FaArrowLeft, FaBook, FaList } from 'react-icons/fa';
import '../../Styles/Admin/AddStudent.css';

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

const AddStudent = () => {
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
    validateAndSetFile(selectedFile);
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
    validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (incomingFile) => {
    if (!incomingFile) return;
    const fileExtension = incomingFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      setError('Only Excel files (.xlsx or .xls) are allowed');
      setFile(null);
      setFileSelected(false);
      return;
    }
    setFile(incomingFile);
    setFileSelected(true);
    setError('');
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
    try {
      const response = await axios.post(
        'http://localhost:4000/adminregisterstudent',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const { data } = response;
      if (data.results && Array.isArray(data.results)) {
        const successCount = data.results.filter(r => r.status === 'success').length;
        setSuccess(`Successfully added ${successCount} students!`);
        setError('');
        setFile(null);
        setFileSelected(false);
      } else {
        setError('Unexpected server response');
      }
    } catch (err) {
      setError('Error uploading file. Please try again.');
      setSuccess('');
      console.error('Upload error:', err);
    }
    setIsLoading(false);
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
            <span className="link-icon"><FaList /></span> Add Student
          </a>
        </nav>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <h2 className="section-title">Upload Excel File</h2>
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
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="back-btn"
              disabled={isLoading}
            >
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

export default AddStudent;
