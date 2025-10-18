import dotenv from "dotenv";

import { Request, Response } from "express";

import { AppDataSource } from "@root/ormconfig";
import { User } from "@entities/User";

import { AuthService } from "@srv/AuthService";
import { AuthenticatedRequest } from "@customtypes/authTypes";

dotenv.config();

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepo = AppDataSource.getRepository(User);

    this.authService = new AuthService(userRepo);
  }

  /**
   * Регистрирует нового пользователя
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
   * Аутентификация
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
   * Возврщает id авторизованного пользователя
   */
  async info(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      // проверяем, есть ли пользователь в БД
      // на случай, если пользователь был удален, а токен еще не протух
      const user = await this.authService.getUserData(req.user.id);
      if(!user) {
        return res.status(400).json({ error: "User not found "});
      }

      // возвращаем id пользователя
      return res.status(200).json({
        id: user.id,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to retrieve user info" });
    }
  }

  async refresh() {}

  async logout() {}
}
