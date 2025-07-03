const express = require("express");
const router = express.Router();
const Course = require("../model/course");
const Program = require("../model/Program");
const multer = require("multer");
const xlsx = require("xlsx"); // or some other package or file
const fs = require("fs");
const upload = multer({ dest: "uploads/" });

//ye API course fecth karne ke liye hai admin view course ke liye
router.get("/", async (req, res) => {
  try {
    const { programName } = req.query; // 📝 get programName from query parameters

    let query = {};

    if (programName) {
      // 🔍 Step 1: Find program by name (case-insensitive)
      const foundProgram = await Program.findOne({
        p_name: new RegExp(`^${programName.trim()}$`, "i"),
      });

      if (!foundProgram) {
        return res.status(404).json({
          status: false,
          message: `Program with name "${programName}" not found`,
        });
      }

      // 🔍 Step 2: Use _id for Course query
      query.program = foundProgram._id;
    }

    // 🔍 Step 3: Fetch courses (filtered or all)
    const courses = await Course.find(query).populate("program");

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        status: false,
        message: programName
          ? `No courses found for program "${programName}"`
          : "No courses found",
      });
    }

    // ✅ Build clean formatted response
    let results = [];
    let sr_no = 1;

    for (let course of courses) {
      results.push({
        sr_no: sr_no++,
        c_title: course.c_title,
        c_category: course.c_category,
        cr_hours: course.cr_hours,
        program_name: course.program ? course.program.p_name : "N/A",
      });
    }

    res.json({
      status: true,
      message: "Courses retrieved successfully",
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Server error: " + error.message,
    });
  }
});

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

// // GET /course?programId=cs101 student view wali API hai jo view studnt par data fetch kti hsi filtter kar ke 
router.get("/c", async (req, res) => {
  try {
    const { programId } = req.query;

    let query = {};

    if (programId) {
      const program = await Program.findOne({ p_id: programId });

      if (!program) {
        return res.status(404).json({
          status: false,
          message: "Program not found with p_id " + programId,
        });
      }

      query.program = program._id; // ✅ Use ObjectId of program
    }

    const courses = await Course.find(query).populate("program");

    res.json({
      status: true,
      message: "Courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Server error: " + error.message,
    });
  }
});

// ye admin course ko add kare upload kare ga....
// ✅ POST route to upload courses from excel


router.post('/uploadCourses', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const errors = [];
    const validCourses = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      const c_code = String(row.c_code || '').trim().toLowerCase();
      const c_title = String(row.c_title || '').trim();
      const c_category = String(row.c_category || '').trim();
      const cr_hours = Number(row.cr_hours);
      const p_name = String(row.p_name || '').trim();

      if (!c_code || !c_title || !c_category || !cr_hours || !p_name) {
        errors.push({ row: rowNumber, error: 'Missing required field(s).' });
        continue;
      }

      const existing = await Course.findOne({ c_code });
      if (existing) {
        errors.push({ row: rowNumber, error: `Course code '${c_code}' already exists.` });
        continue;
      }

      const validCategories = ['Core', 'Elective', 'General'];
      if (!validCategories.includes(c_category)) {
        errors.push({ row: rowNumber, error: `Invalid c_category '${c_category}'.` });
        continue;
      }

      const program = await Program.findOne({ p_name: { $regex: `^${p_name}$`, $options: 'i' } });
      if (!program) {
        errors.push({ row: rowNumber, error: `Program '${p_name}' not found.` });
        continue;
      }

      validCourses.push({
        c_code,
        c_title,
        c_category,
        cr_hours,
        program: program._id
      });
    }

    fs.unlink(req.file.path, () => {});

    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation errors found. No courses inserted.',
        errors
      });
    }

    await Course.insertMany(validCourses);

    return res.status(201).json({
      status: true,
      message: 'All courses inserted successfully.',
      insertedCount: validCourses.length,
      courses: validCourses
    });

  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({
      status: false,
      message: 'Server error while uploading courses.',
      error: error.message
    });
  }
});


// ✅ GET one course by c_code
router.get("/:c_code", async (req, res) => {
  try {
    const course = await Course.findOne({ c_code: req.params.c_code }).populate(
      "program"
    );
    if (!course) return res.status(404).json({ error: "Course nahi mila" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// ✅ POST create new course
router.post("/", async (req, res) => {
  try {
    const { c_code, c_title, c_category, cr_hours, p_id } = req.body;

    if (!c_code || !c_title || !c_category || !cr_hours || !p_id) {
      return res
        .status(400)
        .json({
          error:
            "Sab fields zaroori hain: c_code, c_title, c_category, cr_hours, p_id",
        });
    }

    const trimmed = {
      c_code: c_code.trim(),
      c_title: c_title.trim(),
      c_category: c_category.trim(),
      cr_hours: Number(cr_hours),
      p_id: p_id.trim().toLowerCase(),
    };

    const existingCourse = await Course.findOne({ c_code: trimmed.c_code });
    if (existingCourse) {
      return res
        .status(400)
        .json({ error: `c_code ${trimmed.c_code} pehle se mojood hai` });
    }

    const foundProgram = await Program.findOne({ p_id: trimmed.p_id });
    if (!foundProgram) {
      return res
        .status(404)
        .json({ error: `Program ${trimmed.p_id} nahi mila` });
    }

    const course = new Course({
      c_code: trimmed.c_code,
      c_title: trimmed.c_title,
      c_category: trimmed.c_category,
      cr_hours: trimmed.cr_hours,
      program: foundProgram._id,
    });

    await course.save();

    res
      .status(201)
      .json({
        message: "Course ban gaya",
        course: await course.populate("program"),
      });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: `Duplicate c_code ${req.body.c_code || "unknown"}.` });
    }
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// ✅ PUT update course
router.put("/:c_code", async (req, res) => {
  try {
    const { c_title, c_category, cr_hours, p_id } = req.body;
    if (!c_title || !c_category || !cr_hours || !p_id) {
      return res
        .status(400)
        .json({
          error: "c_title, c_category, cr_hours, p_id sab zaroori hain",
        });
    }

    const program = await Program.findOne({ p_id: p_id.trim().toLowerCase() });
    if (!program) return res.status(404).json({ error: "Program nahi mila" });

    const updated = await Course.findOneAndUpdate(
      { c_code: req.params.c_code },
      {
        c_title: c_title.trim(),
        c_category: c_category.trim(),
        cr_hours: Number(cr_hours),
        program: program._id,
      },
      { new: true }
    ).populate("program");

    if (!updated) return res.status(404).json({ error: "Course nahi mila" });
    res.json({ message: "Course update ho gaya", course: updated });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// ✅ DELETE course
router.delete("/:c_code", async (req, res) => {
  try {
    const deleted = await Course.findOneAndDelete({
      c_code: req.params.c_code,
    });
    if (!deleted) return res.status(404).json({ error: "Course nahi mila" });
    res.json({ message: "Course delete ho gaya" });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

module.exports = router;
