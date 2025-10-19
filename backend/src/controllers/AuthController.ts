import dotenv from "dotenv";

import { Request, Response } from "express";

import { AppDataSource } from "@root/ormconfig";
import { User } from "@entities/User";

import { BaseController } from "@controllers/BaseController";

import { AuthService } from "@srv/AuthService";
import { AuthenticatedRequest } from "@customtypes/authTypes";
import { Session } from "@entities/Session";

dotenv.config();

export class AuthController extends BaseController {
  private authService: AuthService;

  constructor() {
    super();
    const userRepo = AppDataSource.getRepository(User);
    const sessionRepo = AppDataSource.getRepository(Session);

    this.authService = new AuthService(userRepo, sessionRepo);
  }

  /**
   * регистарция нового пользователя
   */
  async signUp(req: Request, res: Response) {
    try {
      const result = await this.authService.handleUserSignUp(
        req.body.id,
        req.body.password
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * аутентификация / авторизация пользователя
   */
  async signIn(req: Request, res: Response) {
    try {
      const result = await this.authService.handleUserSignIn(
        req.body.id,
        req.body.password
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * информация о пользователе
   */
  async info(req: AuthenticatedRequest, res: Response) {
    try {
      if (!this.validateAuthenticated(req, res)) return;

      // проверяем, есть ли активная сессиия в БД
      const session = await this.authService.getSessionData(req.user!.session);
      if (!session) {
        return res.status(400).json({ error: "Active session not found" });
      }

      // проверяем, есть ли пользователь в БД
      // на случай, если пользователь был удален, а токен еще не протух
      const user = await this.authService.getUserData(req.user!.id);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // возвращаем id пользователя
      return res.status(200).json({
        id: user.id,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to retrieve user info" });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const token = await this.authService.handleTokenRefresh(refreshToken);

      return res.status(200).json(token);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (!this.validateAuthenticated(req, res)) return;

      // проверяем, есть ли активная сессиия в БД
      const session = await this.authService.getSessionData(req.user!.session);
      if (!session) {
        return res.status(400).json({ error: "Active session not found" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      await this.authService.handleUserLogout(token);
      res.status(200).json({ message: "Logout successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
