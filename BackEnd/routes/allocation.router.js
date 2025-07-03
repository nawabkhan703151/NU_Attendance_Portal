const express = require('express');
const router = express.Router();
const Allocation = require('../model/allocation.js');
const Session = require('../model/session.js');
const Teacher = require('../model/Teacher.js');
const Course = require('../model/course.js');
const multer = require("multer");
const xlsx = require("xlsx"); 
const fs = require("fs");
const upload = multer({ dest: "uploads/" });

// POST: Create a new allocation
// router.post('/', async (req, res) => {
//   try {
//     const { section_name, teacher_t_id, session_id, course_c_code } = req.body;

//     // Validate request body
//     if (!section_name || !teacher_t_id || !session_id || !course_c_code) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Request body must contain: section_name, teacher_t_id, session_id, course_c_code'
//       });
//     }

//     // Lookup references
//     const [teacher, session, course] = await Promise.all([
//       Teacher.findOne({ t_id: teacher_t_id }),
//       Session.findOne({ ses_id: session_id }),
//       Course.findOne({ c_code: course_c_code })
//     ]);

//     if (!teacher) return res.status(404).json({ 
//       success: false,
//       message: `Teacher with t_id ${teacher_t_id} not found` 
//     });
//     if (!session) return res.status(404).json({ 
//       success: false,
//       message: `Session with ses_id ${session_id} not found` 
//     });
//     if (!course) return res.status(404).json({ 
//       success: false,
//       message: `Course with c_code ${course_c_code} not found` 
//     });

//     // Check for existing allocation
//     const existingAllocation = await Allocation.findOne({
//       section_name,
//       session: session._id,
//       Courses: course._id,
//       Teachers: teacher._id
//     });

//     if (existingAllocation) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'This teacher is already allocated to this course-section-session combination'
//       });
//     }

//     // Create new allocation
//     const allocation = await Allocation.create({
//       section_name,
//       Teachers: [teacher._id],
//       session: session._id,
//       Courses: [course._id]
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Allocation created successfully',
//       allocation: {
//         section_name,
//         teacher_t_id,
//         session_id,
//         course_c_code
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Error creating allocation', 
//       error: error.message 
//     });
//   }
// });


// ✅ POST route to upload allocation Excel
router.post('/uploadAllocations', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty.' });
    }

    const results = [];
    const validatedRows = []; // only valid rows go here

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const sectionName = row['section_name']?.toString().trim();
      const teacherEmail = row['teacher_email']?.toString().trim().toLowerCase();
      const sessionName = row['session_name']?.toString().trim().toLowerCase();
      const courseCode = row['course_code']?.toString().trim();
      const courseNameExcel = row['course_name']?.toString().trim();

      if (!sectionName || !teacherEmail || !sessionName || !courseCode || !courseNameExcel) {
        results.push({ row: rowNum, status: 'error', message: 'Missing required fields in this row.' });
        continue;
      }

      const session = await Session.findOne({ session_name: sessionName });
      if (!session) {
        results.push({ row: rowNum, status: 'error', message: `Session '${sessionName}' not found.` });
        continue;
      }

      const teacher = await Teacher.findOne({ email: teacherEmail });
      if (!teacher) {
        results.push({ row: rowNum, status: 'error', message: `Teacher with email '${teacherEmail}' not found.` });
        continue;
      }

      const course = await Course.findOne({ c_code: courseCode });
      if (!course) {
        results.push({ row: rowNum, status: 'error', message: `Course with code '${courseCode}' not found.` });
        continue;
      }

      const warnings = [];
      if (course.c_title.toLowerCase() !== courseNameExcel.toLowerCase()) {
        warnings.push(`Course name mismatch. Excel: '${courseNameExcel}', DB: '${course.c_title}'.`);
      }

      validatedRows.push({ rowNum, sectionName, teacher, session, course, warnings });
    }

    if (validatedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. No data inserted.',
        results,
      });
    }

    for (const { rowNum, sectionName, teacher, session, course, warnings } of validatedRows) {
      let allocation = await Allocation.findOne({ section_name: sectionName, session: session._id });

      if (allocation) {
        const teacherExists = allocation.Teachers.includes(teacher._id);
        const courseExists = allocation.Courses.includes(course._id);

        let updated = false;
        if (!teacherExists) {
          allocation.Teachers.push(teacher._id);
          updated = true;
        }
        if (!courseExists) {
          allocation.Courses.push(course._id);
          updated = true;
        }

        if (updated) {
          await allocation.save();
          results.push({ row: rowNum, status: 'success', message: 'Allocation updated.', warnings });
        } else {
          results.push({ row: rowNum, status: 'skipped', message: 'Already exists.', warnings });
        }
      } else {
        const newAlloc = new Allocation({
          section_name: sectionName,
          session: session._id,
          Teachers: [teacher._id],
          Courses: [course._id]
        });
        await newAlloc.save();
        results.push({ row: rowNum, status: 'success', message: 'New allocation created.', warnings });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Allocation Excel processed.',
      results,
    });

  } catch (err) {
    console.error('UploadAllocations Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during allocation upload.',
      error: err.message
    });
  }
});



// ✅ GET all allocations
router.get('/', async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate({
        path: 'Teachers',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'username' // ✅ sirf username fetch karo
        }
      })
      .populate('session', 'session_name')
      .populate('Courses', 'c_title')
      .lean();

    const response = allocations.map((alloc, index) => ({
      sr_no: index + 1,
      id: alloc._id,
      section_name: alloc.section_name,
      session_name: alloc.session ? alloc.session.session_name : '',
      teachers: alloc.Teachers.map(t => t.userId ? t.userId.username : 'Unknown Teacher'),
      courses: alloc.Courses.map(c => c.c_title),
    }));

    res.json({
      success: true,
      message: 'All allocations fetched.',
      data: response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching allocations.'
    });
  }
});

// GET: Get allocations by session
router.get('/session/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const session = await Session.findOne({ ses_id: session_id });
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Session not found' 
      });
    }

    const allocations = await Allocation.find({ session: session._id })
      .populate('Teachers', 't_id')
      .populate('Courses', 'c_code')
      .lean();

    const response = allocations.map(allocation => ({
      section_name: allocation.section_name,
      teachers: allocation.Teachers.map(t => t.t_id),
      session_id,
      courses: allocation.Courses.map(c => c.c_code)
    }));

    res.status(200).json({
      success: true,
      session_id,
      session_name: session.session_name,
      allocations: response,
      count: response.length
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching allocations', 
      error: error.message 
    });
  }
});

// DELETE: Delete allocation by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await Allocation.findByIdAndDelete(id);
    if (!allocation) {
      return res.status(404).json({ 
        success: false,
        message: 'Allocation not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Allocation deleted successfully',
      deleted_allocation: {
        section_name: allocation.section_name,
        id: allocation._id
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting allocation', 
      error: error.message 
    });
  }
});

module.exports = router;