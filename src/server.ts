import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler";
import authRouter from "./routes/auth";
import blogRouter from "./routes/blog";
import userRouter from "./routes/user";
import commentRouter from "./routes/comment";
import searchRouter from "./routes/search";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "*", // Change to your frontend URL in production
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.disable("x-powered-by");

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Blog Platform API is running 🚀" });
});

app.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "Database connected ✅" });
  } catch (err) {
    res.status(500).json({ error: "Database connection failed ❌" });
  }
});

// Mount routers with version prefix:
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/search", searchRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
