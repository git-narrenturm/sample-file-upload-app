import dotenv from "dotenv";
import { Writable } from "stream";

import { Request, Response } from "express";
import { IncomingForm, File as FormidableFile } from "formidable";

import { AppDataSource } from "@root/ormconfig";
import { File } from "@entities/File";

import { FileService } from "@srv/FileService";
import { FileDTO } from "@customtypes/fileTypes";
import { AuthenticatedRequest } from "../types/authTypes.js";

dotenv.config();

export class FileController {
  private fileService: FileService;

  private fileMaxSize: number;

  constructor() {
    const fileRepo = AppDataSource.getRepository(File);

    this.fileService = new FileService(fileRepo);

    this.fileMaxSize = Number(process.env.FILE_MAX_SIZE!);
  }

  /**
   * метод для парсинга файла и получения данных файла
   */
  private async parseFile(
    req: AuthenticatedRequest
  ): Promise<{ buffer: Buffer; file: FormidableFile }> {
    // возвращаем промис
    return new Promise((resolve, reject) => {
      // массив для хранения частей файла в памяти
      const buffer: Buffer[] = [];

      // создаем новый инстанс парсера
      const form = new IncomingForm({
        multiples: false,
        keepExtensions: true,
        maxFieldsSize: this.fileMaxSize,
        // пользовательский хэнлдер для записей частей файла в память
        fileWriteStreamHandler: () => {
          return new Writable({
            // добавляем текущую часть файла в массив и сообщаем, что часть обработана
            write(chunk, _encoding, callback) {
              buffer.push(Buffer.from(chunk));
              callback();
            },
          });
        },
      });

      // парсим входящий запрос
      form.parse(req, (err, _fields, files) => {
        // отклоняем промис, если возникла ошибка при парсинге
        if (err) {
          return reject(new Error(`Failed to parse file: ${err.message}`));
        }

        // отклоняем промис, если файл не подан
        const uploadedFiles = files.file;
        if (!uploadedFiles) {
          return reject(new Error("No file uploaded"));
        }

        // обрабатываем массив как одиночный файл
        const file: FormidableFile = Array.isArray(uploadedFiles)
          ? uploadedFiles[0]
          : uploadedFiles;

        // возвращаем готовый  результат через резолв
        resolve({
          buffer: Buffer.concat(buffer),
          file,
        });
      });
    });
  }

  /**
   * вывод файла
   */
  async getFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const result: FileDTO | null = await this.fileService.getFile(id);
      if (!result) {
        return res.status(400).json({ error: "File not found" });
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: "Failed to retrieve file" });
    }
  }

  /**
   * вывод списка файлов
   */
  async getFileList(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { page: pageStr = "1", list_size: listSizeStr = "10" } = req.query;
      const page = Number(pageStr);
      const size = Number(listSizeStr);

      const result = await this.fileService.getFileList(page, size);
      res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: "Failed to retrieve file list" });
    }
  }

  /**
   * загрузка файла
   */
  async uploadFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { buffer, file } = await this.parseFile(req);
      const userId = req.user!.id;

      // вызываем сервис
      // передаем имя файла, mime-тип, размер и файл из буфера памяти
      const savedFile = await this.fileService.handleFileUpload({
        filename: file.originalFilename || "unknown",
        mimeType: file.mimetype || "application/octet-stream",
        size: file.size,
        data: buffer,
        createdById: userId,
        modifiedById: userId,
      });

      return res.status(200).json({
        id: savedFile.id,
        createdAt: savedFile.createdAt,
        createdBy: savedFile.createdBy,
        modifiedAt: savedFile.modifiedAt,
        modifiedBy: savedFile.modifiedBy,
        filename: savedFile.filename,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: "Failed to save file", error: err.message });
    }
  }

  /**
   * обновление файла
   */
  async updateFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { buffer, file } = await this.parseFile(req);
      const { id } = req.params;
      const userId = req.user!.id;

      // вызываем сервис
      // передаем имя файла, mime-тип, размер и файл из буфера памяти
      await this.fileService.handleFileUpdate({
        id,
        filename: file.originalFilename || "unknown",
        mimeType: file.mimetype || "application/octet-stream",
        size: file.size,
        data: buffer,
        modifiedById: userId,
      });

      const updateFile: FileDTO | null = await this.fileService.getFile(id);

      return res.status(200).json(updateFile);
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: "Failed to save file", error: err.message });
    }
  }

  /**
   * удаление файла
   */
  async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { id } = req.params;
      await this.fileService.handleFileDelete(id);
      return res.status(204).json({ message: "File successfully deleted " });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: "Failed to delete file", error: err.message });
    }
  }

  /**
   * скачивание файла
   */
  async downloadFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const { id } = req.params;

      const file = await this.fileService.handleFileDownload(id);
      if (!file) {
        return res.status(400).json({ error: "File not found" });
      }

      // устанавливаем хэдеры, чтобы браузер понимал, что это файл на скачку
      const headers = new Map([
        [
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(file.filename)}"`,
        ],
        ["Content-Type", file.mimeType],
        ["Content-Length", String(file.data.length)],
      ]);
      res.setHeaders(headers);

      // в ответе отправляем данные файла
      return res.status(200).send(file.data);
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: "Failed to delete file", error: err.message });
    }
  }
}
