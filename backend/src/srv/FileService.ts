import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";

import { Request, Response } from "express";

import { Repository } from "typeorm";
import { File } from "@entities/File";
import { FileDTO } from "../types/fileTypes.js";
import { User } from "../entities/User.js";

dotenv.config();

interface FileInput {
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdById: string;
  modifiedById: string;
}

interface FileUpdate {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  modifiedById: string;
}

export class FileService {
  private fileRepo: Repository<File>;

  constructor(fileRepo: Repository<File>) {
    this.fileRepo = fileRepo;
  }

  private async getFileById(id: string): Promise<File | null> {
    const file = await this.fileRepo.findOneBy({ id });
    if (!file) {
      return null;
    }
    return file;
  }

  private async getFileByIdWithData(id: string): Promise<File | null> {
    const file = await this.fileRepo
      .createQueryBuilder("f")
      .addSelect("f.data")
      .where("f.id = :id", { id })
      .getOne();
    if (!file) {
      return null;
    }
    return file;
  }

  /**
   * сохраняет файл
   */
  async handleFileUpload({
    filename,
    mimeType,
    size,
    data,
    createdById,
    modifiedById,
  }: FileInput) {
    const extension = path.extname(filename).slice(1);

    const newFile = this.fileRepo.create({
      filename,
      extension,
      mimeType,
      size,
      data,
      createdById,
      modifiedById,
    });

    return await this.fileRepo.save(newFile);
  }

  async handleFileDownload(id: string) {
    return await this.getFileByIdWithData(id);
  }

  async handleFileUpdate({
    id,
    filename,
    mimeType,
    size,
    data,
    modifiedById,
  }: FileUpdate) {
    const extension = path.extname(filename).slice(1);

    const result = await this.fileRepo.update(id, {
      filename,
      extension,
      mimeType,
      size,
      data,
      modifiedById,
    });

    if (result.affected === 0) {
      throw new Error("File not found");
    }

    return true;
  }

  /**
   * удаляет файл по id
   */
  async handleFileDelete(id: string) {
    const result = await this.fileRepo.delete({ id });
    if (result.affected === 0) {
      throw new Error("File not found");
    }

    return true;
  }

  /**
   * находит файл по id
   */
  async getFile(id: string) {
    return await this.getFileById(id);
  }

  /**
   * выводит список файлов
   */
  async getFileList(page: number, size: number) {
    const skip = (page - 1) * size;

    const [files, total] = await this.fileRepo.findAndCount({
      skip,
      take: size,
      order: { createdAt: "DESC" },
    });
    return { total, page, size, files };
  }
}
