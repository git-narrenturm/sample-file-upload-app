import { Response } from "express";
import { AuthenticatedRequest } from "@customtypes/authTypes";

/**
 * класс с переиспользуемыми методами
 * abstract - не может быть создан напрямую с помощью new
 */
export abstract class BaseController {
  /**
   * проверяет, что пользователь аутентифицирован
   * protected - метод доступен только внутри класса и у его наследников
   */
  protected validateAuthenticated(req: AuthenticatedRequest, res: Response): boolean {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }
    return true;
  }
}
