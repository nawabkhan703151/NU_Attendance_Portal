const express = require('express');
const router = express.Router();
const Student = require('../model/Student.js');
const User = require('../model/User.js');
const Batch = require('../model/batch.js'); // Make sure this is required if not already
const Program = require('../model/Program.js');
const Enrollment = require('../model/Enrollment.js');
const Session = require('../model/session.js');
const Course = require('../model/course.js');

// GET all students
router.get('', async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'U_Id username');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});


// student view kay lay course lati hau program jab select karo 
router.get('/', async (req, res) => {
  try {
    const { programId } = req.query; // 📝 get programId from query parameters

    let query = {};
    if (programId) {
      query.program = programId; // 🎯 filter only if programId is provided
    }

    const courses = await Course.find(query).populate('program');

    res.json({
      status: true,
      message: 'Courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Server error: ' + error.message,
    });
  }
});


router.get('/all', async (req, res) => {
  try {
    // 🔎 Fetch all students with user info
    const students = await Student.find()
      .populate('userId', 'U_Id username')
      .lean();

    // 🔎 Fetch all programs
    const programs = await Program.find().lean();
    const programMap = {};
    programs.forEach(p => { programMap[p.p_id] = p.p_name; });

    // 🔎 Fetch all enrollments with session populated
    const enrollments = await Enrollment.find()
      .populate('session', 'session_name')
      .lean();

    // 🔎 Create a map of studentId to session_name
    const studentSessionMap = {};
    enrollments.forEach(e => {
      if (e.student && e.session) {
        studentSessionMap[e.student.toString()] = e.session.session_name;
      }
    });

    // 🔧 Format response
    const formatted = students.map((s, i) => ({
      sr_no: i + 1,
      reg_no: s.st_id,
      name: s.userId ? s.userId.username : 'Unknown',
      program_name: programMap[s.p_id] || 'Unknown Program',
      session_name: studentSessionMap[s._id.toString()] || 'Unknown Session',
      section_name: s.section_name,
    }));

    res.status(200).json({
      status: true,
      message: 'All students retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Student API error:', error);
    res.status(500).json({ status: false, error: error.message });
  }
});
//
//fiter student view
router.get('/filter', async (req, res) => {
  try {
    const { program, session, section, subject } = req.query;

    // 🔎 Validate required filters
    if (!program || !session || !section || !subject) {
      return res.status(400).json({
        status: false,
        message: 'Program, session, section, and subject are required',
      });
    }

    // 🔎 Find Program by p_name
    const programData = await Program.findOne({ p_name: program });
    if (!programData) {
      return res.status(404).json({
        status: false,
        message: 'Program not found',
      });
    }

    // 🔎 Find Session by session_name
    const sessionData = await Session.findOne({ session_name: session });
    if (!sessionData) {
      return res.status(404).json({
        status: false,
        message: 'Session not found',
      });
    }

    // 🔎 Find Course by c_title
    const courseData = await Course.findOne({ c_title: subject });
    if (!courseData) {
      return res.status(404).json({
        status: false,
        message: 'Subject not found',
      });
    }

    // 🔎 Find enrollments matching filters
    const enrollments = await Enrollment.find({
      session: sessionData._id,
      section_name: section,
      course: courseData._id,
    }).populate({
      path: 'student',
      populate: { path: 'userId', select: 'username' },
    });

    // 🔎 Filter by program (since student has p_id as program ID)
    const filteredStudents = enrollments.filter(e =>
      e.student && e.student.p_id === programData.p_id
    );

    // 🔎 Format data
    const formatted = filteredStudents.map((e, i) => ({
      sr_no: i + 1,
      reg_no: e.student.st_id,
      name: e.student.userId?.username || 'Unknown',
      program_name: programData.p_name,
      session_name: sessionData.session_name,
      section_name: e.section_name,
    }));

    res.status(200).json({
      status: true,
      message: 'Filtered students retrieved successfully',
      data: formatted,
    });

  } catch (error) {
    console.error('Filter API error:', error);
    res.status(500).json({ status: false, error: error.message });
  }
});


// GET single student by st_id
router.get('/:st_id', async (req, res) => {
  try {
    const student = await Student.findOne({ st_id: req.params.st_id })
      .populate('userId', 'U_Id username');
    if (!student) return res.status(404).json({ error: 'Student nahi mila' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// UPDATE student CGPA or section_name
router.put('/:st_id', async (req, res) => {
  try {
    const { CGPA, section_name } = req.body;
    if (CGPA === undefined && !section_name) {
      return res.status(400).json({ error: 'Kam se kam ek field (CGPA ya section_name) zaroori hai' });
    }

    const updates = {};
    if (CGPA !== undefined) {
      if (isNaN(CGPA) || CGPA < 0 || CGPA > 4) {
        return res.status(400).json({ error: 'CGPA 0 se 4 ke beech hona chahiye' });
      }
      updates.CGPA = Number(CGPA);
    }

    if (section_name) {
      updates.section_name = section_name; // just update field directly
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { st_id: req.params.st_id },
      updates,
      { new: true }
    ).populate('userId', 'U_Id username');

    if (!updatedStudent) return res.status(404).json({ error: 'Student nahi mila' });
    res.json({ message: 'Student update ho gaya', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// DELETE student
router.delete('/:st_id', async (req, res) => {
  try {
    const deletedStudent = await Student.findOneAndDelete({ st_id: req.params.st_id });
    if (!deletedStudent) return res.status(404).json({ error: 'Student nahi mila' });
    await User.deleteOne({ _id: deletedStudent.userId });
    res.json({ message: 'Student delete ho gaya' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});




module.exports = router;
