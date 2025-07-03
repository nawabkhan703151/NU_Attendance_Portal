const mongoose = require('mongoose');
const db = require('../config/db');

const courseSchema = new mongoose.Schema({
  c_code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
//    match: /^[A-Z]{2,4}\d{3}[A-Z]?$/, // Optional: CS101, ENG201A jaisa format
  },
  c_title: {
    type: String,
    required: true,
    trim: true
  },
  c_category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Core', 'Elective', 'General'], // Optional: Allowed categories
  },
  cr_hours: {
    type: Number,
    required: true,
  //   min: [1, 'Credit hours kam se kam 1 hona chahiye'],
  //   max: [6, 'Credit hours 6 se zyada nahi ho sakta']
   },
  program: { // Changed from Program to program for naming consistency
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  }
}, { versionKey: false });

const Course = db.model('Course', courseSchema);
module.exports = Course;