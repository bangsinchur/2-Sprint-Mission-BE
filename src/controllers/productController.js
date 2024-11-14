import express from "express";
import auth from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { assert } from "superstruct";
import prisma from "../config/prisma.js";
import { CreateProduct, PatchProduct } from "../../structs.js"; // structs.js 파일의 경로를 정확히 입력하세요
import upload from "../middlewares/upload.js"; // Multer 미들웨어 가져오기

const productController = express.Router();

productController.get(
  "/",
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 10, order = "recent", searchTerm } = req.query;
    let orderBy;
    switch (order) {
      case "favorite":
        orderBy = { favoriteCount: "desc" };
        break;
      case "recent":
      default:
        orderBy = { createdAt: "desc" };
    }
    const products = await prisma.product.findMany({
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
      include: {
        comments: {
          select: {
            content: true,
          },
        },
      },
      where: {
        OR: [
          {
            name: {
              contains: searchTerm || " ",
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchTerm || " ",
              mode: "insensitive",
            },
          },
        ],
      },
    });
    res.send(products);
  })
);

productController.get(
  "/:id",
  auth.verifyAccessToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        comments: true,
      },
    });
    res.send(product);
  })
);

productController.post(
  "/",
  auth.verifyAccessToken,
  upload.single("image"),
  async (req, res, next) => {
    const imagePath = req.file ? req.file.path : null;
    const userId = Number(req.user.userId);
    console.log("유저아이디", userId);
    // assert(req.body, CreateProduct);
    try {
      const data = {
        ...req.body,
        userId,
        images: imagePath ? [imagePath] : [],
      };
      console.log("Product Data to be created:", data);
      const product = await prisma.product.create({ data });
      res.status(201).send(product);
    } catch (error) {
      next(error);
    }
  }
);

productController.patch(
  "/:id",
  auth.verifyAccessToken,
  asyncHandler(async (req, res) => {
    assert(req.body, PatchProduct);
    const { id } = req.params;
    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });
    res.send(product);
  })
);

productController.delete(
  "/:id",
  auth.verifyAccessToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.sendStatus(204);
  })
);

productController.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comments } = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        comments: true,
      },
    });
    res.send(comments);
  })
);

export default productController;
