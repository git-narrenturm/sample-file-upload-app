import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { Repository } from "typeorm";
import { User } from "@entities/User";

import { UserDTO } from "@customtypes/authTypes";

dotenv.config();

export class AuthService {
  private userRepo: Repository<User>;

  private jwtSecret = process.env.JWT_SECRET!;
  private jwtExpiresIn = (process.env.JWT_EXPIRE as any) || "10m";

  constructor(userRepo: Repository<User>) {
    this.userRepo = userRepo;
  }

  // метод для проверки, были ли поданы и логин, и пароль
  private validateCredentials(id?: string, password?: string) {
    if (!id || !password) {
      throw new Error("ID and password are required");
    }
    return { id, password };
  }

  // метод для проверки формата логина (email или номер телефона)
  private validateId(id: string) {}

  private async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      return null;
    }
    return user;
  }

  private async getUserDTOById(id: string): Promise<UserDTO | null> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      return null;
    }
    const { password, ...userDTO } = user;
    return userDTO;
  }

  private async generateToken(id: string) {
    const payload = { id };
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
    return { accessToken };
  }

  /**
   * Регистрирует нового пользователя
   */
  async handleUserSignUp(id: string, password: string) {
    this.validateCredentials(id, password);

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

    const token = await this.generateToken(user.id);
    return { ...token };
  }

  async getUserData(id: string) {
    return await this.getUserDTOById(id);
  }

  async handleUserLogout() {}

  async handleTokenRefresh() {}
}
