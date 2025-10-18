import { Repository } from "typeorm";

import { FileService } from "@srv/FileService";

import { File } from "@entities/File";
import { FileDTO } from "@customtypes/fileTypes";

describe("FileService", () => {
  let fileService: FileService;
  let fileRepoMock: any;

  beforeEach(() => {
    fileRepoMock = {
      findOneBy: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    fileService = new FileService(fileRepoMock as Repository<File>);
  });

  describe("getFile", () => {
    const id = "bfd5408d-f5f9-4de4-82f6-777eb1fb7846";

    it("should return file data if file exists", async () => {
      const mockedValue = {
        id,
        createdAt: "2025-10-18T14:57:41.565Z",
        modifiedAt: "2025-10-18T14:57:41.565Z",
        filename: "test.txt",
        extension: "txt",
        mimeType: "text/plain",
        size: "4",
      };
      fileRepoMock.findOneBy.mockResolvedValue(mockedValue);

      const result: FileDTO | null = await fileService.getFile(id);

      expect(fileRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual(mockedValue);
    });

    it("should return null if file does not exist", async () => {
      fileRepoMock.findOneBy.mockResolvedValue(null);
      const result: FileDTO | null = await fileService.getFile(id);
      expect(fileRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toBeNull;
    });
  });

  describe("getFileList", () => {
    it("should return paginated list of files", async () => {
      const mockFiles = [
        { id: 1, filename: "test1.txt" },
        { id: 2, filename: "test2.txt" },
      ];

      const mockTotal = 10;
      const mockPage = 1;
      const mockSize = 15;
      const mockSkip = (mockPage - 1) * mockSize;

      fileRepoMock.findAndCount.mockResolvedValue([mockFiles, mockTotal]);

      const result = await fileService.getFileList(mockPage, mockSize);

      expect(fileRepoMock.findAndCount).toHaveBeenCalledWith({
        skip: mockSkip,
        take: mockSize,
        order: { createdAt: "DESC" },
      });

      expect(result).toEqual({
        total: mockTotal,
        page: mockPage,
        size: mockSize,
        files: mockFiles,
      });
    });
  });

  describe("handleFileDelete", () => {
    it("should delete a file successfully", async () => {
      const id = "existingFile";
      fileRepoMock.delete.mockResolvedValue({ affected: 1 });
      await expect(fileService.handleFileDelete(id)).toBeTruthy;
    });

    it("should throw an error if file is not found", async () => {
      const id = "unexistringFile";
      fileRepoMock.delete.mockResolvedValue({ affected: 0 });
      await expect(fileService.handleFileDelete(id)).rejects.toThrow(
        "File not found"
      );
    });
  });
});
