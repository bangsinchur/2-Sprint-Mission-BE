import express from "express";
import userService from "../services/userService.js";

const userController = express.Router();

userController.post("/auth/signUp", async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

userController.post('/auth/signIn', async (req, res, next) => {
    const { email, password } = req.body;
    try {
      const user = await userService.getUser(email, password);
      return res.json(user);
    } catch (error) {
      next(error);
    }
  });
  







export default userController;
