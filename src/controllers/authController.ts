import { Request, Response } from "express";
import * as authService from "../services/authService";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser(
      email,
      password
    );

    // Send refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(401).json({ error: message });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Read refresh token from HttpOnly cookie
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    // Call service to verify and generate new access token
    const accessToken = await authService.refreshAccessToken(token);

    res.json({ accessToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token refresh failed";
    res.status(401).json({ error: message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Clear refresh token cookie on logout
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
}
