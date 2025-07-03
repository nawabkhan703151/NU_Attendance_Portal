const mongoose = require('mongoose');
const db = require('../config/db');

// Student Schema

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  st_id: {
    type: String,
    required: true,
    unique: true,
  },
  p_id: {
    type: String,
    required: true, // Program ID
  },
  b_id: {
    type: String,
    required: true, // Batch ID
  },
  section_name: {
    type: String,
    required: true,
  },
  CGPA: {
    type: Number,
    required: true,
    min: 0,
    max: 4,
  },
}, {
  versionKey: false,
});

//const Student = db.model('Student', studentSchema);
const Student = db.models.Student || db.model('Student', studentSchema);
module.exports=Student;


