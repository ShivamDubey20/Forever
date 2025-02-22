import express from "express"
import { loginUser, registerUser, adminLogin, getAllUsers, deleteUser, banUser } from "../controllers/userController.js"
import adminAuth from "../middleware/adminAuth.js"

const userRouter = express.Router()

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/admin", adminLogin)

// Add these new admin routes
userRouter.get("/all", adminAuth, getAllUsers)
userRouter.post("/delete", adminAuth, deleteUser)
userRouter.post("/ban", adminAuth, banUser)

export default userRouter

