const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const Teacher = require('../model/Teacher.js');
const Course = require('../model/course.js');
const Timetable = require('../model/timetable.js');
const Student = require('../model/Student.js');
 const  Attendance = require('../model/attendance.js');
 const Session = require('../model/session.js');
const Enrollment = require('../model/Enrollment.js');



// jab teacher accept ya reject krey to student ko wapis pata chle 
// GET: /student/:stId/complaint-status

router.get('/student/:stId/complaint-status', async (req, res) => {
  try {
    const { stId } = req.params;

    if (!stId) {
      return res.status(400).json({ status: false, message: 'Student ID is required' });
    }

    // Step 1: Find the student by st_id
    const student = await Student.findOne({ st_id: stId });
    if (!student) {
      return res.status(404).json({ status: false, message: 'Student not found' });
    }

    // Step 2: Get all enrollments for the student
    const enrollments = await Enrollment.find({ student: student._id });
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ status: false, message: 'No enrollments found for this student' });
    }

    // Step 3: Get attendance complaints, excluding expired
    let complaintRecords = await Attendance.find({
      enrollment: { $in: enrollments.map(e => e._id) },
      st_comment: { $exists: true, $ne: "" },
      $or: [
        { comment_status: { $ne: 'Expired' } },
        { comment_status: { $exists: false } }
      ]
    })
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          select: 'c_title c_code'
        }
      })
      .populate({
        path: 'teacher',
        select: 't_id'
      })
      .populate('session')
      .sort({ date: -1 })
      .lean();

    const now = new Date();
    const validRecords = [];

    for (let record of complaintRecords) {
      let appealStatus = record.comment_status || 'Pending';

      // Check if expired
      if (record.comment_expiry && appealStatus === 'Pending') {
        const expiry = new Date(record.comment_expiry);
        if (expiry <= now) {
          appealStatus = 'Expired';

          // Update in DB
          await Attendance.updateOne(
            { _id: record._id },
            { $set: { comment_status: 'Expired' } }
          );

          continue; // ⛔ Don't push this expired record
        }
      }

      validRecords.push({
        date: record.date,
        subject: record.enrollment?.course?.c_title || 'N/A',
        courseCode: record.enrollment?.course?.c_code || 'N/A',
        teacherId: record.teacher?.t_id || 'N/A',
        status: record.status === 'P' ? 'Present' : 'Absent',
        appeal: appealStatus,
        comment: record.st_comment || '',
        session: record.session?.session_name || 'N/A'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Complaint results fetched successfully',
      data: validRecords
    });

  } catch (err) {
    console.error('Error in complaint-status endpoint:', err);
    return res.status(500).json({
      status: false,
      message: 'Server error occurred',
      error: err.message
    });
  }
});
//teahcer update karey ga
router.put('/complaint/response', async (req, res) => {
  try {
    const { stId, date, courseCode, action, teacherId, timetableId } = req.body;

    if (!stId || !date || !courseCode || !action || !teacherId || !timetableId) {
      return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    const formattedDate = date;

    const student = await Student.findOne({ st_id: stId });
    const course = await Course.findOne({ c_code: courseCode });
    const teacher = await Teacher.findOne({ t_id: teacherId });

    if (!student || !course || !teacher) {
      return res.status(404).json({
        status: false,
        message: 'Student, course or teacher not found',
        debug: {
          studentExists: !!student,
          courseExists: !!course,
          teacherExists: !!teacher
        }
      });
    }

    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: course._id
    });

    if (!enrollment) {
      return res.status(404).json({
        status: false,
        message: 'Enrollment not found',
        debug: {
          studentId: student._id,
          courseId: course._id
        }
      });
    }

    // ✅ Fix: Wrap string inside backticks (``) for template literals
    const updated = await Attendance.findOneAndUpdate(
      {
        enrollment: enrollment._id,
        teacher: teacher._id,
        date: formattedDate,
        timetable: timetableId,
        comment_status: 'Pending'
      },
      {
        $set: {
          status: action === 'Accepted' ? 'P' : 'A',
          comment_status: action,
          st_comment: `Complaint ${action.toLowerCase()} by teacher`,
          comment_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: 'No matching attendance complaint found',
        debug: {
          date,
          enrollmentId: enrollment._id,
          teacherId: teacher._id
        }
      });
    }

    return res.status(200).json({
      status: true,
      message: `Complaint ${action.toLowerCase()} successfully`,
      data: {
        stId,
        courseCode,
        date,
        status: updated.status,
        complaintStatus: updated.comment_status
      }
    });

  } catch (err) {
    console.error('❗ Error handling complaint response:', err);
    return res.status(500).json({
      status: false,
      message: 'Server error',
      error: err.message
    });
  }
});


 
// GET:ya teacher dashboard pay sari compliants ko fatch krey gi 
// router.get('/teacher/:t_id/complaints', async (req, res) => {
//   try {
//     const { t_id } = req.params;

//     const teacher = await Teacher.findOne({ t_id });
//     if (!teacher) return res.status(404).json({ status: false, message: 'Teacher not found' });

//     const attendanceRecords = await Attendance.find({
//       Teachers: teacher._id,
//       Comment_Status: 'Pending',
//     })
//       .populate('Teachers', 't_id')
//       .populate('Students', 'st_id')
//       .populate('Course', 'c_code c_title');

//     if (!attendanceRecords.length) {
//       return res.status(200).json({ status: true, message: 'No pending complaints found', data: [] });
//     }

//     const currentDateTime = moment.tz('Asia/Karachi');
//     for (let attendance of attendanceRecords) {
//       if (attendance.Comment_Expiry && currentDateTime.isAfter(attendance.Comment_Expiry)) {
//         attendance.Comment_Status = 'Expired';
//         await attendance.save();
//       }
//     }

//     const response = attendanceRecords
//       .filter(att => att.Comment_Status === 'Pending')
//       .map(att => ({
//         stId: att.Students[0]?.st_id || '',
//         date: moment(att.Date).format('DD-MM-YYYY'),
//         courseTitle: att.Course?.c_title || '',
//         status: att.Status || 'Absent',
//         courseCode: att.Course?.c_code || '',
//         comment: att.St_Comment || '',
//       }));

//     res.status(200).json({ status: true, message: 'Pending complaints fetched successfully', data: response });
//   } catch (error) {
//     res.status(500).json({ status: false, message: 'Error fetching pending complaints', error: error.message });
//   }
// });

///////
router.get('/:teacherId/complaints', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const currentDate = new Date();

    // 1. Find teacher and validate
    const teacher = await Teacher.findOne({ t_id: teacherId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // 2. Fetch attendance records with complaints
    const complaints = await Attendance.find({
      teacher: teacher._id,
      st_comment: { $exists: true, $ne: "" }, // Has a complaint
      $or: [
        { comment_status: "Pending" },
        { comment_status: { $exists: false } } // Backward compatibility
      ],
      comment_expiry: { $gt: currentDate } // Not expired
    })
      .populate([
        {
          path: 'enrollment',
          populate: [
            { path: 'student', select: 'st_id p_id section_name' },
            { path: 'course', select: 'c_code c_title cr_hours' }
          ]
        },
        { path: 'session', select: 'session_name' },
        { path: 'teacher', select: 't_id' }
      ])
      .sort({ date: -1 }) // Newest first
      .lean();

    // 3. Format the response
    const formattedComplaints = complaints.map(record => {
      const enrollment = record.enrollment || {};
      const student = enrollment.student || {};
      const course = enrollment.course || {};
      const session = record.session || {};

      return {
        complaintId: record._id,
        student: {
          id: student._id,
          st_id: student.st_id,
          program: student.p_id,
          section: student.section_name
        },
        course: {
          code: course.c_code,
          title: course.c_title,
          creditHours: course.cr_hours
        },
        session: session.session_name,
        date: record.date,
        attendanceStatus: record.status, // <-- 'P' or 'A'
        status: record.status === 'P' ? 'Present' : 'Absent', // for readability
        comment: record.st_comment,
        complaintStatus: record.comment_status || 'Pending',
        expiry: record.comment_expiry,
        lastUpdated: record.updatedAt,
        timetableId: record.timetable?.toString() || ''
      };
    });

    res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      data: formattedComplaints
    });

  } catch (error) {
    console.error("Teacher complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
///////

//
// router.post('/complaint', async (req, res) => {
//   try {
//     const { studentId, courseCode, date, comment } = req.body;

//     if (!studentId || !courseCode || !date || !comment) {
//       return res.status(400).json({
//         status: false,
//         message: 'studentId, courseCode, date, and comment are required',
//       });
//     }

//     const attendanceDate = moment.tz(date, ['DD-MM-YYYY', 'YYYY-MM-DD'], 'Asia/Karachi');
//     if (!attendanceDate.isValid()) {
//       return res.status(400).json({
//         status: false,
//         message: 'Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD',
//       });
//     }

//     const formattedDate = attendanceDate.format('DD-MM-YYYY');
//     const attendanceDateObj = attendanceDate.toDate();
//     const now = new Date();

//     const student = await Student.findOne({ st_id: studentId });
//     if (!student) {
//       return res.status(404).json({ status: false, message: 'Student not found' });
//     }

//     const course = await Course.findOne({ c_code: courseCode });
//     if (!course) {
//       return res.status(404).json({ status: false, message: 'Course not found' });
//     }

//     const enrollment = await Enrollment.findOne({
//       student: student._id,
//       course: course._id,
//     });
//     if (!enrollment) {
//       return res.status(404).json({ status: false, message: 'Enrollment not found' });
//     }

//     const attendanceRecords = await Attendance.find({
//       enrollment: enrollment._id,
//       date: formattedDate,
//       status: 'A',
//     });

//     if (!attendanceRecords || attendanceRecords.length === 0) {
//       return res.status(404).json({ status: false, message: 'No Absent attendance found for this date' });
//     }

//     const eligible = attendanceRecords.find((record) => {
//       const recordDate = moment.tz(record.date, 'DD-MM-YYYY', 'Asia/Karachi').toDate();
//       const diffHours = (now - recordDate) / (1000 * 60 * 60);

//       return (
//         diffHours <= 24 &&
//         (!record.st_comment || record.comment_status === 'Expired')
//       );
//     });

//     if (!eligible) {
//       return res.status(400).json({ status: false, message: 'Complaint not allowed for this record (maybe already submitted or expired)' });
//     }

//     // Save the complaint
//     eligible.st_comment = comment;
//     eligible.comment_status = 'Pending';
//     eligible.comment_expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

//     await eligible.save();

//     return res.status(200).json({
//       status: true,
//       message: 'Complaint submitted successfully',
//       data: {
//         stId: student.st_id,
//         courseCode: course.c_code,
//         courseTitle: course.c_title,
//         date: eligible.date,
//         status: eligible.status,
//         comment: eligible.st_comment,
//         expiry: eligible.comment_expiry,
//         _id: eligible._id,
//       },
//     });

//   } catch (err) {
//     console.error('Complaint error:', err);
//     return res.status(500).json({ status: false, message: 'Server error', error: err.message });
//   }
// });
//

///new 
router.post('/complaint', async (req, res) => {
  try {
    const { stId, courseCode, date, comment, teacherId, timetableId } = req.body;

    // 1️⃣ Validate all required fields
    const missingFields = {
      stId: !stId,
      courseCode: !courseCode,
      date: !date,
      comment: !comment,
      teacherId: !teacherId,
      timetableId: !timetableId
    };

    const missing = Object.keys(missingFields).filter(key => missingFields[key]);
    if (missing.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // 2️⃣ Find student, course, teacher, timetable
    const [student, course, teacher, timetable] = await Promise.all([
      Student.findOne({ st_id: stId }),
      Course.findOne({ c_code: courseCode }),
      Teacher.findOne({
        $or: [
          { _id: teacherId },
          { t_id: teacherId },
          { email: teacherId }
        ]
      }),
      Timetable.findById(timetableId)
    ]);

    // 3️⃣ Check if all exist
    if (!student || !course || !teacher || !timetable) {
      return res.status(404).json({
        status: false,
        message: 'Student, Course, Teacher, or Timetable not found',
        notFound: {
          student: !student,
          course: !course,
          teacher: !teacher,
          timetable: !timetable
        }
      });
    }

    // 4️⃣ Get enrollment
    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: course._id
    });
    if (!enrollment) {
      return res.status(404).json({
        status: false,
        message: 'Enrollment not found for this student and course'
      });
    }

    // 5️⃣ Find ALL absent records for this date + course
    const absentRecords = await Attendance.find({
      enrollment: enrollment._id,
      date: date,
      status: 'A'
    });

    if (absentRecords.length === 0) {
      return res.status(404).json({
        status: false,
        message: `No absent records found for ${courseCode} on ${date}`
      });
    }

    // 6️⃣ Check if complaint already exists for THIS timetable slot
    const currentRecord = absentRecords.find(
      record => record.timetable.toString() === timetableId
    );

    if (!currentRecord) {
      return res.status(404).json({
        status: false,
        message: 'Attendance not found for this timetable slot'
      });
    }

    if (currentRecord.comment_status === 'Pending') {
      return res.status(400).json({
        status: false,
        message: 'A pending complaint already exists for this lecture'
      });
    }

    // 7️⃣ Save complaint
    currentRecord.st_comment = comment;
    currentRecord.comment_status = 'Pending';
    currentRecord.comment_expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await currentRecord.save();

    // 8️⃣ Success response
    return res.status(200).json({
      status: true,
      message: 'Complaint submitted successfully',
      data: {
        studentId: stId,
        courseCode,
        date,
        timetableId,
        status: 'Pending'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

///

// GET: Fetch timetable for a course and day
router.get('/timetable/:c_code/:day', async (req, res) => {
  try {
    const { c_code, day } = req.params;

    // Step 1: Course check karo
    const course = await Course.findOne({ c_code }).select('_id').lean();
    if (!course) {
      return res.status(404).json({ message: `Course nahi mila: ${c_code}` });
    }

    // Step 2: Timetable fetch karo
    const timetable = await Timetable.find({
      Courses: course._id,
      Day: day,
    }).select('TimeFrom TimeTo').lean();

    res.status(200).json(timetable);
  } catch (error) {
    console.error('Timetable fetch karne mein error:', error);
    res.status(500).json({
      message: 'Timetable fetch karne mein error',
      error: error.message,
    });
  }
});


// GET: Fetch classes and existing attendance for a teacher on a selected date
router.get('/teacher/:t_id/:date', async (req, res) => {
  try {
    const { t_id, date } = req.params;

    // Validate teacher ID
    const teacher = await Teacher.findOne({ t_id: t_id });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // Validate and convert date to PKT
    const selectedDate = moment.tz(date, 'DD-MM-YYYY', 'Asia/Karachi').toDate();
    if (!selectedDate || selectedDate.toString() === 'Invalid Date') {
      return res.status(400).json({ message: 'Invalid date format. Use DD-MM-YYYY' });
    }

    // Determine the day of the week (short form to match Timetable)
    const dayOfWeekFull = selectedDate.toLocaleString('en-US', { weekday: 'long' });
    const dayMap = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thur',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    const dayOfWeek = dayMap[dayOfWeekFull];

    // Fetch classes from Timetable
    const classes = await Timetable.find({
      Day: dayOfWeek,
      Teachers: teacher._id,
    })
      .populate('Teachers', 't_id')
      .populate('Sections', 'sec_id')
      .populate('Courses', 'c_code c_title');

    if (!classes.length) {
      return res.status(404).json({ message: 'No classes scheduled for this teacher on this day' });
    }

    // Fetch attendance records
    const attendanceRecords = await Attendance.find({
      Date: selectedDate,
      Teachers: teacher._id,
      Course: { $in: classes.map(cls => cls.Courses[0]._id) },
    })
      .populate('Students', 'st_id')
      .populate('Course', 'c_code c_title');

    // Combine data
    const response = classes.map(cls => {
      const relatedAttendance = attendanceRecords.filter(att =>
        att.Course._id.toString() === cls.Courses[0]._id.toString()
      );
      return {
        classDetails: {
          day: cls.Day,
          venue: cls.Venue,
          timeFrom: cls.TimeFrom,
          timeTo: cls.TimeTo,
          semester: cls.Semester,
          teacher: cls.Teachers[0],
          section: cls.Sections[0],
          course: cls.Courses[0],
        },
        attendance: relatedAttendance.length ? relatedAttendance : 'No attendance recorded for this class on this date',
      };
    });

    res.status(200).json({ message: 'Classes and attendance fetched successfully', data: response });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes and attendance', error: error.message });
  }
});

// teacher attendance view kare ga 
router.get('/view', async (req, res) => {
  try {
    const { t_id, c_code } = req.query;

    if (!t_id || !c_code) {
      return res.status(400).json({
        status: false,
        message: 'Teacher ID (t_id) and Course Code (c_code) are required'
      });
    }

    const [teacher, course] = await Promise.all([
      Teacher.findOne({ t_id }).select('_id'),
      Course.findOne({ c_code }).select('_id')
    ]);

    if (!teacher || !course) {
      return res.status(404).json({
        status: false,
        message: 'Teacher or course not found'
      });
    }

    // Step 1: Get enrollments for this course
    const enrollments = await Enrollment.find({ course: course._id })
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'username' }
      });

    if (!enrollments.length) {
      return res.status(200).json({
        status: true,
        message: 'No students enrolled in this course',
        data: []
      });
    }

    const enrollmentIds = enrollments.map(e => e._id);

    // Step 2: Get all attendance records for this teacher + course
    const attendanceRecords = await Attendance.find({
      teacher: teacher._id,
      enrollment: { $in: enrollmentIds }
    })
      .select('enrollment status date')
      .populate({
        path: 'enrollment',
        populate: {
          path: 'student',
          populate: {
            path: 'userId',
            select: 'username'
          }
        }
      })
      .sort({ date: -1 }) // Sort by date descending to match student API
      .lean();

    // Step 3: Get all attendance dates (including duplicates)
    const allDates = attendanceRecords.map(r => r.date).sort((a, b) => new Date(b) - new Date(a));

    // Step 4: Create student-wise attendance map
    const studentAttendanceMap = new Map();

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      const studentId = student._id.toString();
      const attendanceList = [];

      studentAttendanceMap.set(studentId, {
        sr_no: 0, // will set later
        reg_no: student.st_id,
        name: student.userId?.username || 'Unknown',
        section_name: student.section_name,
        attendance: attendanceList,
        total_present: 0,
        total_absent: 0
      });
    }

    // Step 5: Fill attendance records
    for (const record of attendanceRecords) {
      const student = record.enrollment?.student;
      const studentId = student?._id?.toString();
      if (!studentId || !studentAttendanceMap.has(studentId)) continue;

      const entry = studentAttendanceMap.get(studentId);
      entry.attendance.push({
        date: record.date, // Keep full date string (DD-MM-YYYY HH:MM:SS)
        status: record.status
      });

      if (record.status === 'P') {
        entry.total_present++;
      } else if (record.status === 'A') {
        entry.total_absent++;
      }
    }

    // Step 6: Finalize response with color
    const result = Array.from(studentAttendanceMap.values()).map((entry, idx) => {
      const totalClasses = entry.total_present + entry.total_absent;
      const percentage = totalClasses > 0 ? parseFloat(((entry.total_present / totalClasses) * 100).toFixed(2)) : 0;

      let color = 'red';
      if (percentage > 80) {
        color = 'green';
      } else if (percentage > 75) {
        color = 'yellow';
      }

      return {
        sr_no: idx + 1,
        reg_no: entry.reg_no,
        name: entry.name,
        section_name: entry.section_name,
        percentage,
        color, // ✅ Added color here
        total_present: entry.total_present,
        total_absent: entry.total_absent,
        attendance: entry.attendance // List of { date, status }
      };
    });

    res.status(200).json({
      status: true,
      message: 'Attendance summary retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in /view endpoint:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


router.get('/:c_code/:date/:timeFrom/:timeTo/students', async (req, res) => {
  try {
    const { c_code, date, timeFrom, timeTo } = req.params;

    // DD-MM-YYYY to Date conversion
    const [day, month, year] = date.split('-');
    const selectedDate = new Date(`${year}-${month}-${day}T00:00:00Z`);

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use DD-MM-YYYY' });
    }

    // Disallow future dates
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() > now.getTime()) {
      return res.status(400).json({ message: 'Cannot fetch students for future dates' });
    }

    // Get weekday
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = dayNames[selectedDate.getDay()];

    // Find course
    const course = await Course.findOne({ c_code });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Find matching timetable
    const timetable = await Timetable.findOne({
      Day: dayOfWeek,
      TimeFrom: timeFrom,
      TimeTo: timeTo,
      Courses: course._id
    }).populate('session');

    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found for this slot' });
    }

    // Use session + course to find enrollments
    const enrollments = await Enrollment.find({
      course: course._id,
      session: timetable.session._id
    }).populate({
      path: 'student',
      populate: {
        path: 'userId',
        select: 'username U_Id'
      }
    });

    if (!enrollments.length) {
      return res.status(404).json({ message: 'No students enrolled in this course and session' });
    }

    const attendanceDate = `${day}-${month}-${year}`; // e.g., 24-06-2025

    const data = await Promise.all(enrollments.map(async (enroll, index) => {
      const studentId = enroll.student?._id;

      const attendanceRecord = await Attendance.findOne({
        student: studentId,
        Course: course._id,
        Date: attendanceDate
      });

      return {
        SrNo: index + 1,
        regNo: enroll.student?.st_id || 'Unknown',
        name: enroll.student?.userId?.username || 'Unknown',
        status: attendanceRecord?.Status || 'A'
      };
    }));

    res.status(200).json({
      status: true,
      message: 'Students fetched successfully',
      totalStudents: data.length,
      data
    });

  } catch (error) {
    console.error('Error fetching attendance students:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});
//new
router.post('/mark', async (req, res) => {
  try {
    const { t_id, c_code, date, timeFrom, timeTo, attendanceData } = req.body;

    if (!t_id || !c_code || !date || !timeFrom || !timeTo || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    // Date parsing
    const selectedDate = moment.tz(date, 'DD-MM-YYYY', 'Asia/Karachi');
    if (!selectedDate.isValid()) {
      return res.status(400).json({ message: 'Invalid date format. Use DD-MM-YYYY' });
    }
    const formattedDate = selectedDate.format('DD-MM-YYYY');
    const dayOfWeek = selectedDate.format('ddd'); // e.g., Mon, Tue

    // ✅ 1. Check if more than 48 hours have passed
    const now = moment.tz('Asia/Karachi');
    const hoursDiff = now.diff(selectedDate, 'hours');
    if (hoursDiff > 48) {
      return res.status(400).json({ message: 'Cannot mark attendance after 48 hours from class time' });
    }

    // Find teacher and course
    const teacher = await Teacher.findOne({ t_id }).select('_id');
    if (!teacher) return res.status(404).json({ message: `Teacher not found: ${t_id}` });

    const course = await Course.findOne({ c_code }).select('_id');
    if (!course) return res.status(404).json({ message: `Course not found: ${c_code}` });

    // Find matching timetable
    const timetable = await Timetable.findOne({
      Day: dayOfWeek,
      TimeFrom: timeFrom,
      TimeTo: timeTo,
      Courses: course._id,
      Teachers: teacher._id
    }).lean();
    if (!timetable) return res.status(404).json({ message: 'No matching timetable found' });

    // ✅ 2. Check if already marked
    const alreadyMarked = await Attendance.findOne({
      teacher: teacher._id,
      timetable: timetable._id,
      date: formattedDate
    });
    if (alreadyMarked) {
      return res.status(400).json({ message: 'Attendance already marked for this class and date' });
    }

    const attendanceRecords = [];

    for (const entry of attendanceData) {
      if (!entry.st_id || !['P', 'A'].includes(entry.status)) {
        return res.status(400).json({ message: `Invalid attendance entry for student ${entry.st_id}` });
      }

      const student = await Student.findOne({ st_id: entry.st_id }).select('_id');
      if (!student) return res.status(404).json({ message: `Student not found: ${entry.st_id}` });

      // ✅ Find Enrollment
      const enrollment = await Enrollment.findOne({
        student: student._id,
        course: course._id,
        session: timetable.session
      }).select('_id session');

      if (!enrollment) {
        return res.status(404).json({
          message: `Enrollment not found for student ${entry.st_id} in this course and session`
        });
      }

      const attendanceRecord = {
        teacher: teacher._id,
        enrollment: enrollment._id,
        session: enrollment.session,
        date: formattedDate,
        status: entry.status,
        timetable: timetable._id
      };

      if (entry.st_comment && entry.st_comment.trim() !== '') {
        attendanceRecord.st_comment = entry.st_comment.trim();
        attendanceRecord.comment_status = 'Pending';
      }

      attendanceRecords.push(attendanceRecord);
    }

    await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      message: 'Attendance marked successfully',
      total: attendanceRecords.length
    });

  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// DELETE: Delete attendance record
router.delete('/delete', async (req, res) => {
  try {
    const { t_id, st_id, c_code, date } = req.body;

    // Basic Validation
    if (!t_id || !st_id || !c_code || !date) {
      return res.status(400).json({ message: 'Teacher ID, student ID, course code, and date are required' });
    }

    // Validate entities
    const teacherExists = await Teacher.findOne({ t_id: t_id });
    const studentExists = await Student.findOne({ st_id: st_id });
    const courseExists = await Course.findOne({ c_code: c_code });
    if (!teacherExists) return res.status(404).json({ message: 'Teacher not found' });
    if (!studentExists) return res.status(404).json({ message: 'Student not found' });
    if (!courseExists) return res.status(404).json({ message: 'Course not found' });

    // Validate and convert date
    const attendanceDate = moment.tz(date, 'DD-MM-YYYY', 'Asia/Karachi').toDate();
    if (!attendanceDate || attendanceDate.toString() === 'Invalid Date') {
      return res.status(400).json({ message: 'Invalid date format. Use DD-MM-YYYY' });
    }

    // Delete attendance record
    const attendance = await Attendance.findOneAndDelete({
      Teachers: teacherExists._id,
      Students: studentExists._id,
      Course: courseExists._id,
      Date: attendanceDate,
    });
    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found to delete' });
    }

    res.status(200).json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting attendance', error: error.message });
  }
});

//.....ye api jo hai ye view karne ke liye jab student login kar ke viewdetail par click kare ga 
router.get('/student', async (req, res) => {
  try {
    const { studentId, courseCode } = req.query;

    // Student aur Course ko verify karen
    const student = await Student.findOne({ st_id: studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student nahi mila' });
    }

    const course = await Course.findOne({ c_code: courseCode });
    if (!course) {
      return res.status(404).json({ message: 'Course nahi mila' });
    }

    // Attendance fetch karen student aur course ke basis pe
    const attendanceRecords = await Attendance.find({
      Students: student._id,
      Course: course._id
    }).select('Date Status St_Comment Comment_Status Comment_Expiry');

    // Response banayein aapke design ke mutabiq
    const response = attendanceRecords.map(record => ({
      Date: record.Date,
      Status: record.Status,
      Complaint: record.St_Comment ? 'Complaint Submitted' : (record.Status === 'A' ? 'Complaint Button' : 'No Action') // Agar A hai to Complaint Button dikhao
    }));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Kuch error hua hai, phir se try karen' });
  }
});
//

///
function daysDifference(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
//student dashboard se wo apni attendance dekhay.
router.get('/student/:st_id/course/:course_code/attendance', async (req, res) => {
    try {
        const { st_id, course_code } = req.params;
        const currentDate = new Date();

        // Step 1: Get student
        const student = await Student.findOne({ st_id }).select('_id st_id');
        if (!student) {
            return res.status(404).json({ status: false, message: `Student not found: ${st_id}` });
        }

        // Step 2: Get course
        const course = await Course.findOne({ c_code: course_code }).select('_id');
        if (!course) {
            return res.status(404).json({ status: false, message: `Course not found: ${course_code}` });
        }

        // Step 3: Get enrollment
        const enrollment = await Enrollment.findOne({
            student: student._id,
            course: course._id
        }).select('_id');
        if (!enrollment) {
            return res.status(404).json({
                status: false,
                message: `Enrollment not found for student ${st_id} and course ${course_code}`
            });
        }

        // Step 4: Get attendance by enrollment with timetable and teacher populated
        const attendanceRecords = await Attendance.find({ enrollment: enrollment._id })
            .populate('timetable', 'timetable_id')
            .populate('teacher', '_id')
            .sort({ date: -1 })
            .lean();

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(200).json({
                status: true,
                message: `No attendance records found for ${st_id} in this course`,
                data: [],
            });
        }

        // Step 5: Format records
        const formattedRecords = attendanceRecords.map(record => {
            const [day, month, year] = record.date.split('-');
            const recordDate = new Date(`${year}-${month}-${day}`);

            const canComplain =
                record.status === 'A' &&
                (!record.comment_status || record.comment_status === 'Pending') &&
                daysDifference(recordDate, currentDate) <= 7;

            return {
                date: record.date,
                status: record.status,
                canComplain,
                timetableId: record.timetable?._id?.toString() || '',
                teacherId: record.teacher?._id?.toString() || ''
            };
        });

        return res.status(200).json({
            status: true,
            message: 'Attendance fetched successfully',
            data: formattedRecords,
        });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        return res.status(500).json({
            status: false,
            message: 'Server error while fetching attendance',
            error: error.message,
        });
    }
});

///

module.exports = router; 
