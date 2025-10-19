import { Express } from "express";

import { AuthMiddleware } from "@middleware/AuthMiddleware";
import { FileController } from "@controllers/FileController";

const fileRoute = (app: Express) => {
  const middleware = new AuthMiddleware();
  const controller = new FileController();

  app.get("/file/download/:id", middleware.verifyToken, (req, res) =>
    controller.downloadFile(req, res)
  );
  app.get("/file/list", middleware.verifyToken, (req, res) =>
    controller.getFileList(req, res)
  );
  app.get("/file/:id", middleware.verifyToken, (req, res) =>
    controller.getFile(req, res)
  );

  app.post("/file/upload", middleware.verifyToken, (req, res) =>
    controller.uploadFile(req, res)
  );
  app.put("/file/update/:id", middleware.verifyToken, (req, res) =>
    controller.updateFile(req, res)
  );

  app.delete("/file/delete/:id", middleware.verifyToken, (req, res) =>
    controller.deleteFile(req, res)
  );
};

export default fileRoute;
