import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma";

import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtils";

const prisma = new PrismaClient();

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  name: string;
}

export async function registerUser(data: RegisterDto) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
  });
  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({
    userId: user.id,
    role: user.role,
  });

  return { accessToken, refreshToken, user };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    // Verify refresh token
    const jwt = await import("jsonwebtoken");
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
    if (!REFRESH_TOKEN_SECRET) {
      throw new Error("Refresh token secret not set");
    }
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
      userId: number;
      role: string;
    };

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
    });

    return accessToken;
  } catch (err) {
    throw new Error("Invalid refresh token");
  }
}
