import express from "express";
import userService from "../services/userService.js";
import auth from "../middlewares/auth.js";

const userController = express.Router();

userController.get(
  "/users/me",
  auth.verifyAccessToken,
  async (req, res, next) => {
    try {
      const userId = req.user.userId; // 토큰에서 사용자 ID 추출
      const user = await userService.getUserById(userId);
      return res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

userController.post("/auth/signUp", async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

userController.post("/auth/signIn", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await userService.getUser(email, password);
    const accessToken = userService.createToken(user);
    const refreshToken = userService.createToken(user, "refresh");
    await userService.updateUser(user.id, { refreshToken }); // 추가
    return res.json({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

userController.post(
  "/auth/refresh-token",
  auth.verifyRefreshToken,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const { userId } = req.auth;
      const { accessToken, newRefreshToken } = await userService.refreshToken(
        userId,
        refreshToken
      ); // 변경
      await userService.updateUser(userId, { refreshToken: newRefreshToken }); // 추가
      return res.json({ accessToken, refreshToken });
    } catch (error) {
      return next(error);
    }
  }
);

export default userController;
