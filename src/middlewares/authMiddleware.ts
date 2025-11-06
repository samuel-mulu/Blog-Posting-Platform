import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
    req.user = payload as { userId: number; role: string };
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}
