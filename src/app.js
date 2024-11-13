import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateProduct,
  CreateArticle,
  PatchProduct,
  PatchArticle,
  CreateComment,
  PatchComment,
} from "../structs.js";
import { assert } from "superstruct";
import cors from "cors";
import { asyncHandler } from "./middlewares/errorHandler.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import userController from "./controllers/userController.js";
import errorHandler from "./middlewares/errorHandler.js";

const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("", userController);
app.use(errorHandler);
/******************* user ***************/
/** 회원가입 **/
app.post("/signuptest", async (req, res) => {
  const { email, nickname, password } = req.body;

  // 이메일 중복 체크
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return res.status(400).json({ error: "이메일이 이미 사용 중입니다." });
  }

  // 비밀번호 해싱
  const encryptedPassword = await bcrypt.hash(password, 10);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email,
      nickname,
      encryptedPassword,
    },
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
  });
});

/***로그인***/
app.post("/signIntest", async (req, res) => {
  const { email, password } = req.body;

  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return res
      .status(401)
      .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
  }

  // 비밀번호 확인
  const isPasswordValid = await bcrypt.compare(
    password,
    user.encryptedPassword
  );
  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
  }

  // JWT 액세스 토큰 발급
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });

  // 리프레시 토큰 생성
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // 리프레시 토큰을 데이터베이스에 저장
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }, // 리프레시 토큰 필드를 추가해야 합니다.
  });

  res.json({ accessToken, refreshToken });
});

app.post("/signuptest", async (req, res) => {
  const { email, nickname, password } = req.body;

  // 이메일 중복 체크
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return res.status(400).json({ error: "이메일이 이미 사용 중입니다." });
  }

  // 비밀번호 해싱
  const encryptedPassword = await bcrypt.hash(password, 10);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email,
      nickname,
      encryptedPassword,
    },
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
  });
});

/*리프레시 토큰 사용  API*/
app.post("/auth/refresh-tokentest", async (req, res) => {
  const { refreshToken } = req.body;

  // 리프레시 토큰 검증
  if (!refreshToken) return res.sendStatus(401);

  const user = await prisma.user.findUnique({
    where: { refreshToken },
  });

  if (!user) return res.sendStatus(403); // 유효하지 않은 리프레시 토큰

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err) => {
    if (err) return res.sendStatus(403);

    // 새로운 액세스 토큰 발급
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });
    res.json({ accessToken });
  });
});

/*********** products ***********/

app.get(
  "/items",
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

app.get(
  "/items/:id",
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

app.post(
  "/items",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateProduct);
    const product = await prisma.product.create({
      data: req.body,
    });
    res.status(201).send(product);
  })
);

app.patch(
  "/items/:id",
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

app.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.sendStatus(204);
  })
);

app.get(
  "/items/:id/comments",
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

/*********** article ***********/

app.get(
  "/article",
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 10, order = "recent", search } = req.query;
    let orderBy;
    switch (order) {
      case "older":
        orderBy = { createdAt: "asc" };
        break;
      case "recent":
      default:
        orderBy = { createdAt: "desc" };
    }
    const articles = await prisma.article.findMany({
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy,
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
            title: {
              contains: search || " ", //title에 사용자가 입력한 검색어를 담고있는 변수가 포함된경우
              mode: "insensitive", //대소문자 구분없이 검색
            },
          },
          {
            content: {
              contains: search || " ", //content에 사용자가 입력한 검색어를 담고있는 변수가 포함된경우
              mode: "insensitive",
            },
          },
        ],
      },
    });
    res.send(articles);
  })
);

app.get(
  "/article/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const article = await prisma.article.findUniqueOrThrow({
      where: { id },
      include: {
        comments: true,
      },
    });
    res.send(article);
  })
);

app.post(
  "/article",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateArticle);
    const article = await prisma.article.create({
      data: req.body,
    });
    res.status(201).send(article);
  })
);

app.patch(
  "/article/:id",
  asyncHandler(async (req, res) => {
    assert(req.body, PatchArticle);
    const { id } = req.params;
    const article = await prisma.article.update({
      where: { id },
      data: req.body,
    });
    res.send(article);
  })
);

app.delete(
  "/article/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.article.delete({
      where: { id },
    });
    res.sendStatus(204);
  })
);

app.get(
  "/article/:id/comments",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comments } = await prisma.article.findUniqueOrThrow({
      where: { id },
      include: {
        comments: true,
      },
    });
    res.send(comments);
  })
);

/*********** comment ***********/

app.get(
  "/comments",
  asyncHandler(async (req, res) => {
    const comments = await prisma.comment.findMany();
    res.send(comments);
  })
);

app.get(
  "/comments/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id },
    });
    res.send(comment);
  })
);

app.post(
  "/comments",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateComment);
    const comment = await prisma.comment.create({
      data: req.body,
    });
    res.status(201).send(comment);
  })
);

app.patch(
  "/comments/:id",
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

app.delete(
  "/comments/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.comment.delete({ where: { id } });
    res.sendStatus(204);
  })
);

app.listen(process.env.PORT || 3000, () => console.log("Server Started"));
