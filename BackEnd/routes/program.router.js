const express = require('express');
const router = express.Router();
const Course = require('../model/course');
const Program = require('../model/program');
const Department = require('../model/department');
const session = require('../model/session');
const multer = require("multer");
const xlsx = require("xlsx"); 
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
// ✅ GET all courses with program
router.get('', async (req, res) => {
  try {
    const courses = await Course.find().populate('program');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});



// GET all programs Admin dashboard pr 
  router.get('/p', async (req, res) => {
    try {
      const programs = await Program.find()
        .populate('department', 'd_name')
        .lean(); // convert to plain JS object

      // map to custom output with sr_no
      const response = programs.map((prog, index) => ({
        sr_no: index + 1,
        p_id: prog.p_id,
        p_name: prog.p_name,
        d_name: prog.department ? prog.department.d_name : null
      }));

      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        error: 'Programs fetch karne mein error: ' + error.message 
      });
    }
  });

// router.post('/uploadExcel', upload.single('excelFile'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ status: false, message: 'No file uploaded.' });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     const results = [];

//     for (let record of data) {
//       const { p_id, p_name, department } = record;

//       // ✅ Check required fields
//       if (!p_id || !p_name || !department) {
//         results.push({ p_id: p_id || 'N/A', status: 'failed', error: 'Missing fields' });
//         continue;
//       }

//       // ✅ Improved: Case-insensitive department match
//       const dept = await Department.findOne({
//         d_name: { $regex: new RegExp('^' + department.trim() + '$', 'i') }
//       });
//       if (!dept) {
//         results.push({ p_id, status: 'failed', error: `Department "${department}" not found` });
//         continue;
//       }

//       // ✅ Check duplicate program (case-insensitive p_id)
//       const existingProgram = await Program.findOne({ p_id: p_id.trim().toLowerCase() });
//       if (existingProgram) {
//         results.push({ p_id, status: 'failed', error: 'Program already exists' });
//         continue;
//       }

//       // ✅ Insert program
//       const program = new Program({
//         p_id: p_id.trim().toLowerCase(),
//         p_name: p_name.trim(),
//         department: dept._id,
//       });
//       await program.save();

//       results.push({ p_id, status: 'success' });
//     }

//     // ✅ Delete temp file
//     fs.unlink(req.file.path, (err) => {
//       if (err) console.error('Error deleting file:', err.message);
//     });

//     res.status(200).json({
//       status: true,
//       message: 'Program upload processed.',
//       results
//     });

//   } catch (error) {
//     console.error('Upload Excel API error:', error);
//     res.status(500).json({
//       status: false,
//       message: 'Server error while uploading programs.',
//       error: error.message
//     });
//   }
// });


//



// Program ID generator
async function generateProgramId(lastNumber) {
  const newNumber = lastNumber + 1;
  return 'p' + newNumber.toString().padStart(4, '0');
}

router.post('/uploadProgramExcel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded.'
      });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const errors = [];
    const validPrograms = [];

    // ✅ Get last program number once
    const lastProgram = await Program.findOne({}).sort({ p_id: -1 }).lean();
    let lastNumber = 0;

    if (lastProgram && lastProgram.p_id) {
      const match = lastProgram.p_id.match(/\d+/);
      if (match) lastNumber = parseInt(match[0]);
    }

    // ✅ Validate all rows first
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel header at row 1

      const p_name = String(row.p_name || '').trim();
      const departmentName = String(row.department || '').trim();

      if (!p_name || !departmentName) {
        errors.push({
          row: rowNumber,
          error: 'Missing p_name or department'
        });
        continue;
      }

      // Find department
      const dept = await Department.findOne({
        d_name: { $regex: new RegExp('^' + departmentName + '$', 'i') }
      });

      if (!dept) {
        errors.push({
          row: rowNumber,
          error: `Department "${departmentName}" not found`
        });
        continue;
      }

      // Check duplicate program
      const existingProgram = await Program.findOne({
        p_name: p_name,
        department: dept._id
      });

      if (existingProgram) {
        errors.push({
          row: rowNumber,
          error: 'Program already exists for this department'
        });
        continue;
      }

      // Prepare valid program for batch insert
      lastNumber += 1;
      const new_p_id = await generateProgramId(lastNumber);

      validPrograms.push({
        p_id: new_p_id,
        p_name: p_name,
        department: dept._id,
      });
    }

if (errors.length > 0) {
  console.log('🔴 Validation Errors:', errors); // 👈 Add this line

  fs.unlink(req.file.path, (err) => {
    if (err) console.error('Error deleting file:', err.message);
  });

  return res.status(400).json({
    status: false,
    message: 'Validation errors found. No data inserted.',
    errors
  });
}
    // ✅ Insert all valid programs in one go
    await Program.insertMany(validPrograms);

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err.message);
    });

    res.status(200).json({
      status: true,
      message: 'All programs inserted successfully.',
      insertedCount: validPrograms.length,
      programs: validPrograms
    });

  } catch (error) {
    if (error.length > 0) {
  console.log('Validation Errors:', error); 
    console.error('Upload Program Excel API error:', error);
    }
    res.status(500).json({
      status: false,
      message: 'Server error while uploading programs.',
      error: error.message
    });
  }
});

// ✅ GET one course by c_code
router.get('/:c_code', async (req, res) => {
  try {
    const course = await Course.findOne({ c_code: req.params.c_code }).populate('program');
    if (!course) return res.status(404).json({ error: 'Course nahi mila' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ✅ POST create new course
router.post('/', async (req, res) => {
  try {
    const { c_code, c_title, c_category, cr_hours, p_id } = req.body;

    if (!c_code || !c_title || !c_category || !cr_hours || !p_id) {
      return res.status(400).json({ error: 'Sab fields zaroori hain: c_code, c_title, c_category, cr_hours, p_id' });
    }

    const trimmed = {
      c_code: c_code.trim(),
      c_title: c_title.trim(),
      c_category: c_category.trim(),
      cr_hours: Number(cr_hours),
      p_id: p_id.trim().toLowerCase()
    };

    const existingCourse = await Course.findOne({ c_code: trimmed.c_code });
    if (existingCourse) {
      return res.status(400).json({ error: `c_code ${trimmed.c_code} pehle se mojood hai` });
    }

    const foundProgram = await Program.findOne({ p_id: trimmed.p_id });
    if (!foundProgram) {
      return res.status(404).json({ error: `Program ${trimmed.p_id} nahi mila` });
    }

    const course = new Course({
      c_code: trimmed.c_code,
      c_title: trimmed.c_title,
      c_category: trimmed.c_category,
      cr_hours: trimmed.cr_hours,
      program: foundProgram._id
    });

    await course.save();

    res.status(201).json({ message: 'Course ban gaya', course: await course.populate('program') });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: `Duplicate c_code ${req.body.c_code || 'unknown'}.` });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ✅ PUT update course
router.put('/:c_code', async (req, res) => {
  try {
    const { c_title, c_category, cr_hours, p_id } = req.body;
    if (!c_title || !c_category || !cr_hours || !p_id) {
      return res.status(400).json({ error: 'c_title, c_category, cr_hours, p_id sab zaroori hain' });
    }

    const program = await Program.findOne({ p_id: p_id.trim().toLowerCase() });
    if (!program) return res.status(404).json({ error: 'Program nahi mila' });

    const updated = await Course.findOneAndUpdate(
      { c_code: req.params.c_code },
      {
        c_title: c_title.trim(),
        c_category: c_category.trim(),
        cr_hours: Number(cr_hours),
        program: program._id
      },
      { new: true }
    ).populate('program');

    if (!updated) return res.status(404).json({ error: 'Course nahi mila' });
    res.json({ message: 'Course update ho gaya', course: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ✅ DELETE course
router.delete('/:c_code', async (req, res) => {
  try {
    const deleted = await Course.findOneAndDelete({ c_code: req.params.c_code });
    if (!deleted) return res.status(404).json({ error: 'Course nahi mila' });
    res.json({ message: 'Course delete ho gaya' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;