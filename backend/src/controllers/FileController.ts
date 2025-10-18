import dotenv from "dotenv";
import { Writable } from "stream";

import { Request, Response } from "express";
import { IncomingForm, File as FormidableFile } from "formidable";

import { AppDataSource } from "@root/ormconfig";
import { File } from "@entities/File";

import { FileService } from "@srv/FileService";
import { FileDTO } from "@customtypes/fileTypes";

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
   *
   */
  async getFile(req: Request, res: Response) {
    try {
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
   *
   */
  async getFileList(req: Request, res: Response) {
    try {
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
   *
   */
  async uploadFile(req: Request, res: Response) {
    // массив для хранения частей файла в памяти
    const buffer: Buffer[] = [];

    // создаем новый инстанс парсера
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFieldsSize: this.fileMaxSize,
      fileWriteStreamHandler: () => {
        // пользовательский хэнлдер для записей частей файла в память
        return new Writable({
          write(chunk, _encoding, callback) {
            // добавляем текущую часть файла в массив и сообщаем, что часть обработана
            buffer.push(Buffer.from(chunk));
            callback();
          },
        });
      },
    });

    // парсим входящий запрос
    // выкидываем ошибку, если возникла ошибка при парсинге
    form.parse(req, async (err, _fields, files) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Failed to parse file", error: err.message });
      }

      const uploadedFiles = files.file;
      if (!uploadedFiles) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // обрабатываем массив как одиночный файл
      const file: FormidableFile = Array.isArray(uploadedFiles)
        ? uploadedFiles[0]
        : uploadedFiles;

      // вызываем сервис
      // передаем имя файла, mime-тип, размер и все части файла из буфера памяти
      try {
        const savedFile = await this.fileService.handleFileUpload({
          filename: file.originalFilename || "unknown",
          mimeType: file.mimetype || "application/octet-stream",
          size: file.size,
          data: Buffer.concat(buffer),
        });

        return res.status(201).json({
          id: savedFile.id,
          createdAt: savedFile.createdAt,
          modifiedAt: savedFile.modifiedAt,
          filename: savedFile.filename,
          mimeType: savedFile.mimeType,
          size: savedFile.size,
        });
      } catch (err: any) {
        return res
          .status(500)
          .json({ message: "Failed to save file", error: err.message });
      }
    });
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.fileService.handleFileDelete(id);
      return res.status(204).json({ message: "File successfully deleted " });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: "Failed to delete file", error: err.message });
    }
  }
}
