import { PrismaClient } from "@prisma/client";
import { product, article, comment } from "./mock.js";

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제
  await prisma.product.deleteMany();
  await prisma.article.deleteMany();
  await prisma.comment.deleteMany();

  // 제품 데이터 생성
  await prisma.product.createMany({
    data: product,
    skipDuplicates: true,
  });

  // 기사 데이터 생성
  await prisma.article.createMany({
    data: article,
    skipDuplicates: true,
  });

  for (const c of comment) {
    await prisma.comment.create({
      data: c, // userId가 포함된 댓글 데이터 사용
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
