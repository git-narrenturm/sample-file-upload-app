import dotenv from "dotenv";

import { Request, Response } from "express";
import { AppDataSource } from "@root/ormconfig";

import { User } from "@entities/User";

import { AuthService } from "@srv/AuthService";

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
      const result = await this.authService.signUp(
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
      const result = await this.authService.signIn(
        req.body.id,
        req.body.password
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   *
   */
  async info() {}

  async refresh() {}

  async logout() {}
}
