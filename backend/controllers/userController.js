import validator from "validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"

//Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!validator.isEmail(email) || !password) {
      return res.json({ success: false, message: "Please provide valid email and password" })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect password" })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    res.json({ success: true, token, user: { ...user._doc, password: "" } })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Please provide all fields" })
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please provide valid email" })
    }

    if (password.length < 6) {
      return res.json({ success: false, message: "Password must be at least 6 characters" })
    }

    const existingUser = await userModel.findOne({ email })
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new userModel({ name, email, password: hashedPassword })
    await newUser.save()

    res.json({ success: true, message: "User registered successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!validator.isEmail(email) || !password) {
      return res.json({ success: false, message: "Please provide valid email and password" })
    }

    const admin = await userModel.findOne({ email, isAdmin: true })
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect password" })
    }

    const token = jwt.sign({ userId: admin._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "1d" })
    res.json({ success: true, token, admin: { ...admin._doc, password: "" } })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, { password: 0 }) // Exclude password field
    res.json({ success: true, users })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body
    await userModel.findByIdAndDelete(userId)
    res.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Ban user
const banUser = async (req, res) => {
  try {
    const { userId } = req.body
    await userModel.findByIdAndUpdate(userId, { isBanned: true })
    res.json({ success: true, message: "User banned successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { loginUser, registerUser, adminLogin, getAllUsers, deleteUser, banUser }

