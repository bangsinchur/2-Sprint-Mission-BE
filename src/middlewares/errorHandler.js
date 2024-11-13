export default function errorHandler(error, req, res, next) {
    const status = error.code ?? 500;
    console.error(error);
    return res.status(status).json({
      path: req.path,
      method: req.method,
      message: error.message ?? 'Internal Server Error',
      data: error.data ?? undefined,
      date: new Date(),
    });
  }
  

 export function asyncHandler(handler) {
    return async function (req, res) {
      try {
        await handler(req, res);
      } catch (e) {
        if (
          e.name === "StructError" ||
          e instanceof Prisma.PrismaClientValidationError
        ) {
          res.status(400).send({ message: e.message });
        } else if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          res.sendStatus(404);
        } else {
          res.status(500).send({ message: e.message });
        }
      }
    };
  }