const express = require('express');
const router = express.Router();
const Department = require('../model/department.js');
const Teacher = require('../model/teacher.js');
const multer = require("multer");
const xlsx = require("xlsx"); 
const fs = require("fs");
const upload = multer({ dest: "uploads/" });

router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({}, 'd_id d_name'); // ✅ fetch only needed fields

    // ✅ Map with sr_no
    const results = departments.map((dept, index) => ({
      sr_no: index + 1,
      d_id: dept.d_id,
      d_name: dept.d_name
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.post('/uploadDepartments', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file Only' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    const requiredFields = ['d_id', 'd_name'];
    const sheetHeaders = Object.keys(sheetData[0] || {});

    const missingColumns = requiredFields.filter(field => !sheetHeaders.includes(field));
    if (missingColumns.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `Excel sheet missing columns: ${missingColumns.join(', ')}` });
    }

    const existingDepartments = await Department.find({}, 'd_id');
    const existingIds = new Set(existingDepartments.map(d => d.d_id.toLowerCase()));

    let inserted = [];
    let skipped = [];
    let failed = [];
    let departmentDocs = [];

    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      const rowNumber = i + 2;

      let rowErrors = [];
      for (let field of requiredFields) {
        if (!row[field] || String(row[field]).trim() === '') {
          rowErrors.push(`${field} missing or empty`);
        }
      }

      if (rowErrors.length > 0) {
        failed.push({ rowNumber, errors: rowErrors });
        continue;
      }

      const trimmed = {
        d_id: String(row.d_id).trim(),
        d_name: String(row.d_name).trim()
      };

      if (existingIds.has(trimmed.d_id.toLowerCase())) {
        skipped.push({ rowNumber, d_id: trimmed.d_id, reason: 'Already exists' });
        continue;
      }

      departmentDocs.push({
        d_id: trimmed.d_id,
        d_name: trimmed.d_name
      });

      inserted.push({ rowNumber, d_id: trimmed.d_id });
    }

    if (departmentDocs.length > 0) {
      try {
        await Department.insertMany(departmentDocs, { ordered: false });
      } catch (insertErr) {
        console.error("Bulk insert error:", insertErr);
        failed.push({ rowNumber: 'BulkInsert', errors: [insertErr.message] });
      }
    }

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Departments upload process completed',
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      inserted,
      skipped,
      failed
    });

  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});


router.get('/:d_id', async (req, res) => {
  try {
    const department = await Department.findOne({ d_id: req.params.d_id }).populate('teachers', 't_id');
    if (!department) return res.status(404).json({ error: 'Department nahi mila' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { d_id, d_name } = req.body;
    if (!d_id || !d_name) return res.status(400).json({ error: 'd_id aur d_name zaroori hain' });

    const existing = await Department.findOne({ d_id });
    if (existing) return res.status(400).json({ error: 'd_id pehle se maujood hai' });

    const department = new Department({ d_id, d_name, teachers: [] });
    await department.save();
    res.status(201).json({ message: 'Department ban gaya', department });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.put('/:d_id', async (req, res) => {
  try {
    const { d_name } = req.body;
    if (!d_name) return res.status(400).json({ error: 'd_name zaroori hai' });

    const updatedDepartment = await Department.findOneAndUpdate(
      { d_id: req.params.d_id },
      { d_name },
      { new: true }
    ).populate('teachers', 't_id');
    if (!updatedDepartment) return res.status(404).json({ error: 'Department nahi mila' });
    res.json({ message: 'Department update ho gaya', department: updatedDepartment });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.delete('/:d_id', async (req, res) => {
  try {
    const department = await Department.findOne({ d_id: req.params.d_id });
    if (!department) return res.status(404).json({ error: 'Department nahi mila' });

    // Remove department reference from all associated teachers
    await Teacher.updateMany(
      { department: department._id },
      { $unset: { department: 1 } }
    );

    await Department.findOneAndDelete({ d_id: req.params.d_id });
    res.json({ message: 'Department delete ho gaya' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;