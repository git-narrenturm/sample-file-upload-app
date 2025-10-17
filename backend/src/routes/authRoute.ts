import { Express } from "express";

import { AuthController } from "@controllers/AuthController";

const authRoute = (app: Express) => {
  const controller = new AuthController();

  app.post("/signup", (req, res) => controller.signUp(req, res));
  app.post("/signin", (req, res) => controller.signIn(req, res));
};

export default authRoute;
