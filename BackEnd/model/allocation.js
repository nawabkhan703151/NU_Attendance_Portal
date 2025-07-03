const mongoose = require('mongoose');
const db = require('../config/db');

const allocationSchema = new mongoose.Schema({


  section_name: { type: String, required: true },
  Teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true }], // Many-to-many

  session: { // Changed from ses_id to session object
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  Courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }]   // Many-to-many
},
  { versionKey: false });


const allocation = db.model('Allocation', allocationSchema);
module.exports = allocation;