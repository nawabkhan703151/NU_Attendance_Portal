const express = require('express');
const router = express.Router();
const Teacher = require('../model/Teacher.js');
const Department = require('../model/department.js');
const User = require('../model/User.js');

// router.get('/', async (req, res) => {
//   try {
//     const teachers = await Teacher.find()
//       .populate('userId', 'U_Id username')
//       .populate('department', 'd_id d_name');

//     const formattedTeachers = teachers.map(teacher => ({
//       t_id: teacher.t_id,
//       salary: teacher.salary,
//       userName: teacher.userId?.username || 'Unknown',
//       departmentId: teacher.department?.d_id || 'Unknown',
//       departmentName: teacher.department?.d_name || 'Unknown',
//     }));

//     res.json(formattedTeachers);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching teachers', error: error.message });
//   }
// });
//

// Admin dashboard ki teacher list
router.get('/all', async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('userId', 'username U_Phone') // get username and phone from User
      .populate('department', 'd_name') // get department name
      .lean();

    const formatted = teachers.map((t, i) => ({
      sr_no: i + 1,
      name: t.userId?.username || 'Unknown',
      department: t.department?.d_name || 'Unknown',
      phone: t.userId?.U_Phone || 'Unknown',
    }));

    res.status(200).json({
      status: true,
      message: 'All teachers retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ status: false, error: error.message });
  }
});

router.get('/:t_id', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ t_id: req.params.t_id })
      .populate('userId', 'U_Id username')
      .populate('department', 'd_id d_name');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    res.json({
      t_id: teacher.t_id,
      salary: teacher.salary,
      userName: teacher.userId?.username || 'Unknown',
      departmentId: teacher.department?.d_id || 'Unknown',
      departmentName: teacher.department?.d_name || 'Unknown',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher', error: error.message });
  }
});

router.put('/:t_id', async (req, res) => {
  try {
    const { salary, u_id, d_id } = req.body;

    const updates = {};
    if (salary !== undefined) {
      if (isNaN(salary) || salary < 0) {
        return res.status(400).json({ message: 'Salary positive number hona chahiye' });
      }
      updates.salary = Number(salary);
    }

    if (u_id) {
      const user = await User.findOne({ U_Id: u_id });
      if (!user || user.role !== 'teacher') {
        return res.status(404).json({ message: `User with U_Id ${u_id} not found or not a teacher` });
      }
      updates.userId = user._id;
    }

    if (d_id) {
      const department = await Department.findOne({ d_id: d_id.trim() });
      if (!department) {
        return res.status(404).json({ message: `Department with d_id ${d_id} not found` });
      }

      const teacher = await Teacher.findOne({ t_id: req.params.t_id });
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

      if (teacher.department.toString() !== department._id.toString()) {
        const oldDepartment = await Department.findById(teacher.department);
        if (oldDepartment) {
          oldDepartment.teachers = oldDepartment.teachers.filter(
            t => t.toString() !== teacher._id.toString()
          );
          await oldDepartment.save();
        }

        department.teachers = department.teachers || [];
        if (!department.teachers.includes(teacher._id)) {
          department.teachers.push(teacher._id);
          await department.save();
        }
      }

      updates.department = department._id;
    }

    const updatedTeacher = await Teacher.findOneAndUpdate(
      { t_id: req.params.t_id },
      updates,
      { new: true }
    )
      .populate('userId', 'U_Id username')
      .populate('department', 'd_id d_name');

    if (!updatedTeacher) return res.status(404).json({ message: 'Teacher not found' });

    res.json({
      t_id: updatedTeacher.t_id,
      salary: updatedTeacher.salary,
      userName: updatedTeacher.userId?.username || 'Unknown',
      departmentId: updatedTeacher.department?.d_id || 'Unknown',
      departmentName: updatedTeacher.department?.d_name || 'Unknown',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating teacher', error: error.message });
  }
});

router.delete('/:t_id', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ t_id: req.params.t_id });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const department = await Department.findById(teacher.department);
    if (department) {
      department.teachers = department.teachers.filter(
        t => t.toString() !== teacher._id.toString()
      );
      await department.save();
    }

    await Teacher.findOneAndDelete({ t_id: req.params.t_id });
    await User.deleteOne({ _id: teacher.userId });
    res.json({ message: 'Teacher deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
});




module.exports = router;
