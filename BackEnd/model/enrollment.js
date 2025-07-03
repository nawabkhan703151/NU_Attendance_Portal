
const mongoose = require("mongoose");
const db = require("../config/db");

const enrollmentSchema = new mongoose.Schema(
  {
    e_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    section_name: { 
      type: String, 
      required: true 
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
  },
  { 
    versionKey: false 
  }
);

const Enrollment = db.models.Enrollment || db.model("Enrollment", enrollmentSchema);
module.exports = Enrollment;