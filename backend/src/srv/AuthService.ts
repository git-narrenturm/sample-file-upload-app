import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { Repository } from "typeorm";
import { User } from "@entities/User";
import { Session } from "@entities/Session";

import { UserDTO } from "@customtypes/authTypes";

dotenv.config();

export class AuthService {
  private userRepo: Repository<User>;
  private sessionRepo: Repository<Session>;

  private jwtSecret = process.env.JWT_SECRET!;
  private jwtExpiresIn = (process.env.JWT_EXPIRES as any) || "10m";
  private jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  private jwtRefreshExpiresIn =
    (process.env.JWT_REFRESH_EXPIRES_IN as any) || "1h";

  constructor(userRepo: Repository<User>, sessionRepo: Repository<Session>) {
    this.userRepo = userRepo;
    this.sessionRepo = sessionRepo;
  }

  // метод для проверки, были ли поданы и логин, и пароль
  private validateCredentials(id?: string, password?: string) {
    if (!id || !password) {
      throw new Error("ID and password are required");
    }
    return { id, password };
  }

  // метод для проверки формата логина (email или номер телефона)
  private validateId(id: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    return emailRegex.test(id) || phoneRegex.test(id);
  }

  // метод для получения данных пользователя
  private async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      return null;
    }
    return user;
  }

  // метод для получения DTO данных пользователя
  private async getUserDTOById(id: string): Promise<UserDTO | null> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      return null;
    }
    const { password, ...userDTO } = user;
    return userDTO;
  }

  // генерирует токены
  private async generateToken(userId: string, sessionId: string) {
    const payload = { id: userId, session: sessionId };
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });
    return { accessToken, refreshToken };
  }

  /**
   * Регистрирует нового пользователя
   */
  async handleUserSignUp(id: string, password: string) {
    this.validateCredentials(id, password);
    
    if (!this.validateId(id)) {
      throw new Error("Wrong login format");
    }

    // ищем пользователя в БД
    const user = await this.getUserById(id);
    if (user) {
      throw new Error("User already exists");
    }

    // хешируем пароль и создаем нового пользователя
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepo.create({ id, password: hashedPassword });
    await this.userRepo.save(newUser);

    return { message: "User successfully created" };
  }

  /**
   * Аутентификация
   */
  async handleUserSignIn(id: string, password: string) {
    this.validateCredentials(id, password);

    // проверяем, существует ли пользователь
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error("User does not exist");
    }

    // проверяем, совпадают ли пароли
    const hasMatchingPassword = await bcrypt.compare(password, user.password);
    if (!hasMatchingPassword) {
      throw new Error("Invalid credentials");
    }

    // создаем сессию
    const session = this.sessionRepo.create({ user });
    await this.sessionRepo.save(session);

    return await this.generateToken(user.id, session.id);
  }

  /**
   * находит пользователя по id
   */
  async getUserData(id: string) {
    return await this.getUserDTOById(id);
  }

  /**
   * находит сессию по id
   */
  async getSessionData(id: string) {
    const session = await this.sessionRepo.findOneBy({ id });
    if (!session) {
      return null;
    }
    return session;
  }

  /**
   *
   */
  async handleUserLogout(token: string) {
    if (!token) {
      throw new Error("Authorization token is required");
    }

    const payload: any = jwt.verify(token, this.jwtSecret);

    const result = await this.sessionRepo.delete({ id: payload.session });
    if (result.affected === 0) {
      throw new Error("Session not found");
    }

    return true;
  }

  async handleTokenRefresh(token: string) {
    const payload: any = jwt.verify(token, this.jwtRefreshSecret);

    const sessionId = payload.session;

    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) {
      throw new Error("Session not found");
    }

    return await this.generateToken(payload.id, session.id);
  }
}
