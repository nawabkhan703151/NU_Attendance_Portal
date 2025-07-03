const mongoose = require('mongoose');
const db = require('../config/db');

// Teacher Schema

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      
    },

    t_id: {
      type: String,
      required: true,
      unique: true,
    },
  department: { 
  type: mongoose.Schema.Types.ObjectId,
   ref: 'Department',
   required: true },
      
   salary: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { versionKey: false }
);

// const Teacher = db.model('Teacher', teacherSchema);
const Teacher = db.models.Teacher || db.model('Teacher', teacherSchema);
module.exports=Teacher;