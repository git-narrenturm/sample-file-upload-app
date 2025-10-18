import { Request } from "express";

import { User } from "@entities/User";

export type UserDTO = Omit<User, "password">;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}
