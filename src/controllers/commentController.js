import express from "express";
import auth from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { assert } from "superstruct";
import prisma from "../config/prisma.js";



const commentController = express.Router();
//댓글 조회
commentController.get(
  "/",
  asyncHandler(async (req, res) => {
    const comments = await prisma.comment.findMany();
    res.send(comments);
  })
);
commentController.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id },
    });
    res.send(comment);
  })
);

// 댓글 등록
commentController.post(
  "/",
  auth.verifyAccessToken,
  asyncHandler(async (req, res) => {
    assert(req.body, CreateComment);
    const comment = await prisma.comment.create({
      data: req.body,
    });
    res.status(201).send(comment);
  })
);

// 댓글 수정
commentController.patch(
  "/:id",
  auth.verifyAccessToken,
  asyncHandler(async (req, res) => {
    assert(req.body, PatchComment);
    const { id } = req.params;
    const comment = await prisma.comment.update({
      where: { id },
      data: req.body,
    });
    res.send(comment);
  })
);

// 댓글 삭제
commentController.delete(
  "/:id",
  auth.verifyAccessToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.comment.delete({ where: { id } });
    res.sendStatus(204);
  })
);

export default commentController;
