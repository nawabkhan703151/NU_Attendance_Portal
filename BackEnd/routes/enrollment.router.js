const express = require('express');
const router = express.Router();
const Student = require('../model/Student.js');
const Course = require('../model/course.js');
const Session = require('../model/session.js');
const Enrollment = require('../model/Enrollment');
const Offer = require('../model/offer.js');
const multer = require("multer");
const xlsx = require("xlsx"); 
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
// POST: Create a new enrollment

// router.post('/', async (req, res) => {
//   try {
//     const { e_id, student_st_id, course_code, section_name, session_id } = req.body;

//     // ✅ 1. Validate required fields
//     if (!e_id || !student_st_id || !course_code || !section_name || !session_id) {
//       return res.status(400).json({
//         message: 'All fields are required: e_id, student_st_id, course_code, section_name, session_id'
//       });
//     }

//     // ✅ 2. Find required documents
//     const student = await Student.findOne({ st_id: student_st_id });
//     const course = await Course.findOne({ c_code: course_code });
//     const session = await Session.findOne({ ses_id: session_id });

//     if (!student) return res.status(404).json({ message: 'Student not found' });
//     if (!course) return res.status(404).json({ message: 'Course not found' });
//     if (!session) return res.status(404).json({ message: 'Session not found' });

//     // ✅ 3. Check if course is offered in that session
//     const courseOffered = await Offer.findOne({
//       c_code: course_code,
//       session: session._id // <-- Must be ObjectId match
//     });

//     if (!courseOffered) {
//       return res.status(400).json({
//         message: 'This course is not offered in the specified session'
//       });
//     }

//     // ✅ 4. Check for duplicate enrollment by e_id
//     const existingById = await Enrollment.findOne({ e_id });
//     if (existingById) {
//       return res.status(400).json({ message: 'Enrollment ID already exists' });
//     }

//     // ✅ 5. Check if student already enrolled in this course/session
//     const duplicateEnrollment = await Enrollment.findOne({
//       student: student._id,
//       course: course._id,
//       session: session._id
//     });
//     if (duplicateEnrollment) {
//       return res.status(400).json({
//         message: 'Student is already enrolled in this course for this session'
//       });
//     }

//     // ✅ 6. Create new enrollment
//     const enrollment = new Enrollment({
//       e_id,
//       student: student._id,
//       course: course._id,
//       section_name,
//       session: session._id
//     });

//     await enrollment.save();

//     // ✅ 7. Response
//     res.status(201).json({
//       message: 'Enrollment created successfully',
//       enrollment: {
//         e_id: enrollment.e_id,
//         student: student_st_id,
//         course: course_code,
//         section_name,
//         session: session_id
//       }
//     });

//   } catch (error) {
//     console.error('Error creating enrollment:', error);
//     res.status(500).json({
//       message: 'Error creating enrollment',
//       error: error.message
//     });
//   }
// });


// excel se enrollment upload karenge

router.post('/uploadEnrollmentExcel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded.',
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = [];
    const newEnrollments = [];

    let lastEnrollment = await Enrollment.findOne()
      .sort({ e_id: -1 })
      .collation({ locale: "en_US", numericOrdering: true })
      .lean();

    let lastNumber = lastEnrollment ? parseInt(lastEnrollment.e_id) : 0;

    for (const [index, row] of rows.entries()) {
      const errors = [];

      if (!row.student_id) errors.push('Missing student_id');
      if (!row.course_code) errors.push('Missing course_code');
      if (!row.course_name) errors.push('Missing course_name');
      if (!row.section_name) errors.push('Missing section_name');
      if (!row.session_Name) errors.push('Missing session_Name');

      if (errors.length > 0) {
        results.push({
          row: index + 2,
          status: 'error',
          errors,
        });
        continue;
      }

      const student = await Student.findOne({ st_id: row.student_id.trim() });
      if (!student) {
        results.push({
          row: index + 2,
          status: 'error',
          errors: [`Student not found: ${row.student_id}`],
        });
        continue;
      }

      const course = await Course.findOne({
        c_code: row.course_code.trim(),
        c_title: row.course_name.trim(),
      });

      if (!course) {
        results.push({
          row: index + 2,
          status: 'error',
          errors: [`Course not found: ${row.course_code} - ${row.course_name}`],
        });
        continue;
      }

      const session = await Session.findOne({ session_name: row.session_Name.trim() });
      if (!session) {
        results.push({
          row: index + 2,
          status: 'error',
          errors: [`Session not found: ${row.session_Name}`],
        });
        continue;
      }

      lastNumber += 1;
      const new_e_id = lastNumber.toString().padStart(4, '0');

      newEnrollments.push({
        e_id: new_e_id,
        student: student._id,
        course: course._id,
        section_name: row.section_name.trim(),
        session: session._id,
      });

      results.push({
        row: index + 2,
        status: 'success',
        e_id: new_e_id,
      });
    }

    if (newEnrollments.length > 0) {
      await Enrollment.insertMany(newEnrollments);
    }

    return res.status(200).json({
      status: true,
      message: 'Enrollment upload completed.',
      results,
    });

  } catch (err) {
    console.error('Enrollment Upload Error:', err);
    return res.status(500).json({
      status: false,
      message: 'Server error while uploading enrollments.',
      error: err.message,
    });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});


// GET: All enrollments
router.get('/', async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'st_id name email')
      .populate('course', 'c_code c_title credits')
      .populate('session', 'session_name start_date end_date');

    if (!enrollments.length) return res.status(404).json({ message: 'No enrollments found' });

    res.status(200).json(enrollments);

  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
});

// GET: Enrolled students by course code
router.get('/:course_code/students', async (req, res) => {
  try {
    const { course_code } = req.params;
    
    // Find course by code
    const course = await Course.findOne({ c_code: course_code });
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Get enrollments with populated data
    const enrollments = await Enrollment.find({ course: course._id })
      .populate({
        path: 'student',
        select: 'st_id name',
        model: 'Student'
      })
      .populate({
        path: 'session',
        select: 'session_name',
        model: 'Session'
      })
      .lean();

    // Filter out enrollments with null students
    const validEnrollments = enrollments.filter(e => e.student !== null);

    // Prepare response
    const response = {
      success: true,
      course_code: course.c_code,
      course_title: course.c_title,
      students: validEnrollments.map(enroll => ({
        enrollment_id: enroll.e_id,
        student_id: enroll.student.st_id,
        student_name: enroll.student.name,
        section_name: enroll.section_name,
        session_name: enroll.session?.session_name || 'N/A'
      })),
      total_students: validEnrollments.length
    };

    if (validEnrollments.length === 0) {
      response.message = 'No students found for this course';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET: All enrollments for a student
router.get('/student/:student_st_id', async (req, res) => {
  try {
    const { student_st_id } = req.params;

    // Find student by ID
    const student = await Student.findOne({ st_id: student_st_id });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Get all enrollments with populated data
    const enrollments = await Enrollment.find({ student: student._id })
      .populate('course', 'c_code c_title credits')
      .populate('session', 'session_name Start_date End_date')
      .sort({ 'session.Start_date': -1 }); // Sort by session start date (newest first)

    // Format response
    const response = {
      success: true,
      student_id: student.st_id,
      student_name: student.name,
      enrollments: enrollments.map(enroll => ({
        enrollment_id: enroll.e_id,
        course_code: enroll.course.c_code,
        course_title: enroll.course.c_title,
        credits: enroll.course.credits,
        section_name: enroll.section_name,
        session_name: enroll.session.session_name,
        session_dates: {
          start: enroll.session.Start_date,
          end: enroll.session.End_date
        }
      })),
      total_enrollments: enrollments.length
    };

    if (enrollments.length === 0) {
      response.message = 'No enrollments found for this student';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching enrollments', 
      error: error.message 
    });
  }
});

// DELETE: Enrollment by student ID and course
router.delete('/:enrollment_id', async (req, res) => {
  try {
    const { enrollment_id } = req.params;

    // Find and delete enrollment by e_id (unique identifier)
    const enrollment = await Enrollment.findOneAndDelete({ e_id: enrollment_id });

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Enrollment deleted successfully',
      deleted_enrollment: {
        enrollment_id: enrollment.e_id,
        student_id: enrollment.student,
        course_id: enrollment.course
      }
    });

  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting enrollment', 
      error: error.message 
    });
  }
});

module.exports = router;