const express = require("express");
const router = express.Router();
const Timetable = require("../model/timetable.js");
const Teacher = require("../model/Teacher.js");
const Course = require("../model/course.js");
const Student = require("../model/Student.js");
const Enrollment = require("../model/Enrollment.js");
const Attendance = require("../model/attendance.js");
const Session = require("../model/session.js");
const Room = require("../model/room.js");
const moment = require("moment-timezone");
const Department = require("../model/department.js");

// GET: Get timetable slots for a specific teacher and day
// her teacher ka timetable fatch krey gi clander aur bydefault hood se b 
router.get('/teacher/:t_id/:day', async (req, res) => {
  try {
    const { t_id, day } = req.params;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let dayShort = day;

    // Check if input is a date (like "01-06-2025") and convert to weekday
    if (/^\d{2}-\d{2}-\d{4}$/.test(day)) {
      const [dd, mm, yyyy] = day.split('-');
      const dateObj = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);

      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use DD-MM-YYYY' });
      }

      dayShort = dayNames[dateObj.getDay()];
    }

    // Validate Day
    const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!validDays.includes(dayShort)) {
      return res.status(400).json({ message: 'Invalid day. Must be: Mon, Tue, Wed, Thu, Fri, Sat, Sun' });
    }

    // Find Teacher
    const teacher = await Teacher.findOne({ t_id });
    if (!teacher) return res.status(404).json({ message: `Teacher not found: ${t_id}` });

    // Fetch Timetable with Room populated
    const timetables = await Timetable.find({ Teachers: teacher._id, Day: dayShort })
      .populate('Teachers', 't_id')
      .populate({
        path: 'session',
        select: 'ses_id session_name'
      })
      .populate({
        path: 'Courses',
        select: 'c_code c_title'
      })
      .populate({
        path: 'Room', // ✅ Room ko populate kar rahe hain
        select: 'RoomName RoomType'
      })
      .lean();

    if (!timetables.length) {
      return res.status(404).json({ message: `No classes found for ${t_id} on ${dayShort}` });
    }

    // Format Response with RoomName instead of Venue
    const response = timetables.map(timetable => ({
      timetable_id: timetable.timetable_id,
      t_id: timetable.Teachers[0]?.t_id || 'Unknown',
      ses_id: timetable.session?.ses_id || 'Unknown',
      session_name: timetable.session?.session_name || 'Unknown',
      c_code: timetable.Courses[0]?.c_code || 'Unknown',
      c_title: timetable.Courses[0]?.c_title || 'Unknown',
      day: timetable.Day,
      roomName: timetable.Room?.RoomName || 'N/A', // ✅ updated field for RoomName
      roomType: timetable.Room?.RoomType || 'N/A', // optional: RoomType if needed
      TimeTo: timetable.TimeTo,
      TimeFrom: timetable.TimeFrom
    }));

    res.status(200).json({ message: 'Timetable fetched successfully', timetable: response });

  } catch (error) {
    console.error('Error fetching timetable:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
 


// for timetable slot creation
router.post('/', async (req, res) => {
  try {
    let { day, roomName, timeFrom, timeTo, t_id, ses_id, c_code } = req.body;

    // Convert DD-MM-YYYY to Day short form if needed
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (/^\d{2}-\d{2}-\d{4}$/.test(day)) {
      const [dd, mm, yyyy] = day.split('-');
      const dateObj = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use DD-MM-YYYY or short day name' });
      }
      day = dayNames[dateObj.getDay()]; // Convert to "Mon", "Tue", etc.
    }

    // Basic Validation
    if (!day || !roomName || !timeFrom || !timeTo || !t_id || !ses_id || !c_code) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate Day
    const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: 'Invalid day. Must be: Mon, Tue, Wed, Thu, Fri, Sat, Sun' });
    }

    // Validate Time Format
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM AM/PM' });
    }

    // Lookup Entities
    const teacher = await Teacher.findOne({ t_id });
    const session = await Session.findOne({ ses_id });
    const course = await Course.findOne({ c_code });
    const room = await Room.findOne({ RoomName: roomName }); // ✅ Room lookup

    if (!teacher) return res.status(404).json({ message: `Teacher not found: ${t_id}` });
    if (!session) return res.status(404).json({ message: `Session not found: ${ses_id}` });
    if (!course) return res.status(404).json({ message: `Course not found: ${c_code}` });
    if (!room) return res.status(404).json({ message: `Room not found: ${roomName}` });

    // Check for Conflict
    const existingTimetable = await Timetable.findOne({
      Day: day,
      TimeFrom: timeFrom,
      TimeTo: timeTo,
      Room: room._id // ✅ conflict check on Room id
    });

    if (existingTimetable) {
      return res.status(400).json({ message: 'This time slot and room are already booked' });
    }

    // Generate unique timetable_id
    const timetableId = `TT-${Date.now()}`;

    // Create Timetable
    const timetable = new Timetable({
      timetable_id: timetableId,
      Day: day,
      Room: room._id, // ✅ save Room id only
      TimeFrom: timeFrom,
      TimeTo: timeTo,
      Teachers: [teacher._id],
      session: session._id,
      Courses: [course._id]
    });

    await timetable.save();

    // Populate and Return
    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('Teachers', 't_id')
      .populate('session', 'ses_id')
      .populate('Courses', 'c_code c_title')
      .populate('Room', 'RoomName RoomType'); // ✅ populate Room details

    res.status(201).json({
      message: 'Timetable slot created',
      timetable: populatedTimetable.toObject()
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ya student dashboard pay course uar attendance dehkye gi okay 
router.get("/student/:st_id", async (req, res) => {
  try {
    const { st_id } = req.params;

    // Student find karo
    const student = await Student.findOne({ st_id });
    if (!student)
      return res
        .status(404)
        .json({ status: false, message: `Student ${st_id} not found` });

    // Enrollments
    const enrollments = await Enrollment.find({ student: student._id })
      .populate({
        path: "course",
        select: "c_code c_title program",
        populate: {
          path: "program",
          select: "p_name department",
          populate: { path: "department", select: "d_name" },
        },
      })
      .populate("session", "session_name")
      .lean();

    if (enrollments.length === 0) {
      return res.json({
        status: true,
        message: "No enrolled courses found",
        data: [],
      });
    }

    // Attendance Data Calculation
    const attendanceData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.course;

        const totalClasses = await Attendance.countDocuments({
          enrollment: enrollment._id,
        });

        const presentCount = await Attendance.countDocuments({
          enrollment: enrollment._id,
          status: "P",
        });

        const percentage =
          totalClasses === 0
            ? 0
            : Math.round((presentCount / totalClasses) * 100);

        const color =
          percentage > 80 ? "green" : percentage >= 75 ? "orange" : "red";

        return {
          _id: course._id,
          c_code: course.c_code,
          c_title: course.c_title,
          program: course.program?.p_name || "",
          department: course.program?.department?.d_name || "",
          session: enrollment.session?.session_name || "",
          percentage,
          color,
        };
      })
    );

    // Timetable
    const courseIds = enrollments.map((e) => e.course._id);
    const timetables = await Timetable.find({ Courses: { $in: courseIds } })
      .populate("Teachers", "t_id name")
      .populate("session", "session_name")
      .lean();

    const timetableMap = new Map();
    timetables.forEach((t) => {
      t.Courses.forEach((courseId) => {
        const key = courseId.toString();
        if (!timetableMap.has(key)) timetableMap.set(key, []);
        timetableMap.get(key).push({
          Day: t.Day,
          Venue: t.Venue,
          TimeFrom: t.TimeFrom,
          TimeTo: t.TimeTo,
          Teachers: t.Teachers,
          session: t.session?.session_name || "",
        });
      });
    });

    // Final Response
    const data = attendanceData.map((course, index) => ({
      sr_no: index + 1,
      ...course,
      schedules: timetableMap.get(course._id.toString()) || [],
    }));

    return res.json({
      status: true,
      message: "Student courses and attendance fetched",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});



router.get("/", async (req, res) => {
  try {
    console.log("Fetching all timetable slots");
    const timetables = await Timetable.find()
      .populate("Teachers", "t_id")
      .populate("session", "ses_id session_name")
      .populate("Courses", "c_code c_title");

    if (!timetables.length) {
      return res.status(404).json({ message: "No timetable slots found" });
    }

    res.status(200).json(timetables);
  } catch (error) {
    console.error("Error fetching timetable slots:", error.stack);
    res.status(500).json({
      message: "Error fetching timetable slots",
      error: error.message,
    });
  }
});

router.get("/:semester", async (req, res) => {
  try {
    console.log("Fetching timetable slots for semester:", req.params.semester);
    const timetables = await Timetable.find({ Semester: req.params.semester })
      .populate("Teachers", "t_id")
      .populate("Sections", "sec_id section_name")
      .populate("Courses", "c_code c_title");
    if (!timetables.length) {
      return res
        .status(404)
        .json({ message: "No timetable slots found for this semester" });
    }
    res.status(200).json(timetables);
  } catch (error) {
    console.error("Error fetching timetable slots:", error.stack);
    res.status(500).json({
      message: "Error fetching timetable slots",
      error: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { Day, Venue, TimeFrom, TimeTo, t_id, c_code, session_id } = req.body;

    // Validations (simplified)
    if (
      !Day ||
      !Venue ||
      !TimeFrom ||
      !TimeTo ||
      !t_id ||
      !c_code ||
      !session_id
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Lookup references
    const teacher = await Teacher.findOne({ t_id });
    const course = await Course.findOne({ c_code });
    const session = await Session.findById(session_id);

    if (!teacher || !course || !session) {
      return res
        .status(404)
        .json({ message: "Teacher, course, or session not found." });
    }

    // Update document
    const updated = await Timetable.findByIdAndUpdate(
      req.params.id,
      {
        Day,
        Venue,
        TimeFrom,
        TimeTo,
        Teachers: [teacher._id],
        Courses: [course._id],
        session: session._id,
      },
      { new: true }
    )
      .populate("Teachers", "t_id")
      .populate("Courses", "c_code c_title")
      .populate("session", "ses_id session_name");

    if (!updated) {
      return res.status(404).json({ message: "Timetable slot not found" });
    }

    res
      .status(200)
      .json({ message: "Timetable slot updated", timetable: updated });
  } catch (error) {
    res.status(500).json({ message: "_reviewsers", error: error.message });
  }
});

router.delete("/session/:ses_id", async (req, res) => {
  try {
    const { ses_id } = req.params;
    console.log("Deleting timetable slots for session:", ses_id);

    // Step 1: Find session by ses_id (e.g., 'ses01')
    const session = await Session.findOne({ ses_id });

    if (!session) {
      return res
        .status(404)
        .json({ message: `Session not found with ses_id: ${ses_id}` });
    }

    // Step 2: Delete timetable slots with that session's _id
    const result = await Timetable.deleteMany({ session: session._id });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No timetable slots found for this session" });
    }

    res.status(200).json({
      message: `${result.deletedCount} timetable slot(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting timetable slots:", error.stack);
    res.status(500).json({
      message: "Error deleting timetable slots",
      error: error.message,
    });
  }
});



router.get('/student/:st_id', async (req, res) => {
  try {
    const { st_id } = req.params;

    // Step 1: Student find karo
    const student = await Student.findOne({ st_id });
    if (!student) return res.status(404).json({ status: false, message: `Student ${st_id} not found` });

    console.log('Student found:', student.st_id, student._id); // Debugging

    // Step 2: Student ke enrollments fetch karo with population
    const enrollments = await Enrollment.find({ student: student._id })
      .populate({
        path: 'course',
        select: 'c_code c_title program',
        populate: {
          path: 'program',
          select: 'p_name department',
          populate: { path: 'department', select: 'd_name' }
        }
      })
      .populate('session', 'session_name')
      .lean();

    if (enrollments.length === 0) {
      return res.json({ status: true, message: 'No enrolled courses found', data: [] });
    }

    console.log('Enrollments found:', enrollments); // Debugging

    // Step 3: Attendance data calculate karo
    const attendanceData = await Promise.all(enrollments.map(async (enrollment) => {
      const course = enrollment.course;

      // Ensure enrollment._id and session._id are strings
      const enrollmentId = enrollment._id.toString();
      const sessionId = enrollment.session?._id?.toString() || '';

      console.log(`Processing enrollment: ${enrollmentId}, session: ${sessionId}`); // Debugging

      // Total classes count karo
      const totalClasses = await Attendance.countDocuments({
        enrollment: mongoose.Types.ObjectId(enrollmentId),
        session: mongoose.Types.ObjectId(sessionId)
      });

      // Present classes count karo
      const presentCount = await Attendance.countDocuments({
        enrollment: mongoose.Types.ObjectId(enrollmentId),
        status: 'P',
        session: mongoose.Types.ObjectId(sessionId)
      });

      console.log(`Course: ${course.c_code}, Total Classes: ${totalClasses}, Present: ${presentCount}`); // Debugging

      // Percentage calculate karo
      const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);
      const color = percentage > 80 ? 'green' : (percentage >= 75 ? 'orange' : 'red');

      return {
        _id: course._id,
        c_code: course.c_code,
        c_title: course.c_title,
        program: course.program?.p_name || 'N/A',
        department: course.program?.department?.d_name || 'N/A',
        session: enrollment.session?.session_name || 'N/A',
        percentage,
        color
      };
    }));

    // Step 4: Timetable fetch karo
    const courseIds = enrollments.map(e => e.course._id);
    const timetables = await Timetable.find({ Courses: { $in: courseIds } })
      .populate('Teachers', 't_id name')
      .populate('session', 'session_name')
      .lean();

    console.log('Timetables found:', timetables); // Debugging

    // Step 5: Timetable mapping
    const timetableMap = new Map();
    timetables.forEach(t => {
      t.Courses.forEach(courseId => {
        const key = courseId.toString();
        if (!timetableMap.has(key)) timetableMap.set(key, []);
        timetableMap.get(key).push({
          Day: t.Day,
          Venue: t.Venue,
          TimeFrom: t.TimeFrom,
          TimeTo: t.TimeTo,
          Teachers: t.Teachers,
          session: t.session?.session_name || 'N/A'
        });
      });
    });

    // Step 6: Final response data
    const data = attendanceData.map((course, index) => ({
      sr_no: index + 1,
      ...course,
      schedules: timetableMap.get(course._id.toString()) || []
    }));

    return res.json({
      status: true,
      message: 'Student courses and attendance fetched',
      data
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
});





module.exports = router;
