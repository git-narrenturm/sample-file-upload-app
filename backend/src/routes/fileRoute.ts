import { Express } from "express";

import { AuthMiddleware } from "@middleware/AuthMiddleware";
import { FileController } from "@controllers/FileController";

const fileRoute = (app: Express) => {
  const middleware = new AuthMiddleware();
  const controller = new FileController();

  app.get("/file/list", (req, res) => controller.getFileList(req, res));
  app.get("/file/:id", (req, res) => controller.getFile(req, res));

  app.post("/file/upload", (req, res) => controller.uploadFile(req, res));

  app.delete("/file/delete/:id", (req, res) => controller.deleteFile(req, res));
};

export default fileRoute;
