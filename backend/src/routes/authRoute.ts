import { Express } from "express";

import { AuthMiddleware } from "@middleware/AuthMiddleware";
import { AuthController } from "@controllers/AuthController";

const authRoute = (app: Express) => {
  const middleware = new AuthMiddleware();
  const controller = new AuthController();

  app.post("/signup", (req, res) => controller.signUp(req, res));
  app.post("/signin", (req, res) => controller.signIn(req, res));
  app.post("/signin/new_token", middleware.verifyToken, (req, res) =>
    controller.refresh(req, res)
  );

  app.get("/info", middleware.verifyToken, (req, res) =>
    controller.info(req, res)
  );
  app.get("/logout", middleware.verifyToken, (req, res) =>
    controller.logout(req, res)
  );
};

export default authRoute;
