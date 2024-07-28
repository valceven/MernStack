const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users

// @routes GET /users

// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

// @desc Create new user

// @routes POST /users

// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  // Confirm Data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: "All fields are requiresd" });
  }

  // Check for duplicates

  const dupli = await User.findOne({ username }).lean().exec();

  if (dupli) {
    return res.status(409).json({ message: "Duplicate Username" });
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10); // salt rounds

  const userObject = { username, password: hashedPassword, roles };

  //Create and store new users

  const user = await User.create(userObject);

  if (user) {
    res
      .status(201)
      .json({ message: `New user ${username} created successfuilly` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

// @desc Update a user

// @routes PATCH /users

// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  //Confirm Data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not Found" });
  }

  //Check for duplicates

  const duplicates = await User.findOne({ username }).lean().exec();

  // Allow updates to the original user

  if (duplicates && duplicates._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate Username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash Password
    user.password = await bcrypt.hash(password, 10); // Salt Rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated successfully ` });
});

// @desc Delete a user

// @routes DELETE /users

// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  const notes = await Note.findOne({ user: id }).lean().exec();

  if (notes?.length) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not Found" });
  }
  const result = await User.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id}`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
