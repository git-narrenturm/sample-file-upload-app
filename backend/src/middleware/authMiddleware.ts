import { Request, Response, NextFunction } from "express";

import jwt, { JwtPayload } from "jsonwebtoken";

import { AuthenticatedRequest } from "@customtypes/authTypes";

export class AuthMiddleware {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
  }

  public verifyToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      req.user = {
        id: decoded.id,
      };

      next();
    } catch (err) {
      console.error("AuthMiddleware error:", err);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
