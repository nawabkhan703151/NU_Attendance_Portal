const mongoose = require("mongoose");
const db = require("../config/db");

const userSchema = new mongoose.Schema(
  {
    U_Id: {
      type: String,
      required: [true, "u_id is necessary"],
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    U_Phone: {
      type: String,
      required: true,
    },
    DOB: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-2][0-9]|(3)[0-1])(\-)(((0)[0-9])|((1)[0-2]))(\-)\d{4}$/.test(
            v
          );
        },
        message: (props) => `${props.value} is not valid DD-MM-YYYY format!`,
      },
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "teacher", "admin"],
    },
  },
  {
    versionKey: false,
  }
);

userSchema.statics.findByCredentials = async function (username, password) {
  console.log("Searching for username:", username);
  const user = await this.findOne({
    username: { $regex: new RegExp(`^${username}$`, "i") },
  });
  console.log("Found user:", user);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.password !== password) {
    throw new Error("Invalid credentials");
  }

  if (user.role === "student") {
    await user.populate({
      path: "studentProfile",
      select: "st_id sec_id CGPA",
    });
    user.st_id = user.studentProfile?.st_id;
  }

  if (user.role === "teacher") {
    await user.populate({
      path: "teacherProfile",
      select: "t_id d_id salary",
    });
    user.t_id = user.teacherProfile?.t_id;
  }

  return user;
};

userSchema.virtual("studentProfile", {
  ref: "Student",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

userSchema.virtual("teacherProfile", {
  ref: "Teacher",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

userSchema.set("toJSON", { virtuals: true });

//const User = db.model("User", userSchema, "users");
const User = db.models.User || db.model('User', userSchema);
module.exports = { User };
