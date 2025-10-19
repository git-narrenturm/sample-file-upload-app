import jwt from "jsonwebtoken";

import { User } from "@entities/User";
import { Session } from "@entities/Session";

import { AuthService } from "@srv/AuthService";

import { UserDTO } from "@customtypes/authTypes";

jest.mock("jsonwebtoken");

describe("AuthService", () => {
  let authService: AuthService;
  let userRepoMock: any;
  let sessionRepoMock: any;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_REFRESH_SECRET = "testRefreshSecret";

    userRepoMock = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    sessionRepoMock = {
      findOneBy: jest.fn(),
    };

    authService = new AuthService(userRepoMock, sessionRepoMock);
  });

  describe("handleUserSignUp", () => {
    const id = "test@test.test";
    const password = "someStrongPassword";

    it("should throw an error if id is in wrong format", async () => {
      await expect(
        authService.handleUserSignUp("test123", password)
      ).rejects.toThrow("Wrong login format");
    });

    it("should throw an error if id or password is missing", async () => {
      await expect(authService.handleUserSignUp("", password)).rejects.toThrow(
        "ID and password are required"
      );
      await expect(authService.handleUserSignUp(id, "")).rejects.toThrow(
        "ID and password are required"
      );
    });

    it("should register a new user successfully", async () => {
      userRepoMock.findOneBy.mockResolvedValue(null);
      userRepoMock.create.mockImplementation((user: Partial<User>) => user);
      userRepoMock.save.mockResolvedValue({ id });

      const result = await authService.handleUserSignUp(id, password);

      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual({ id });
    });

    it("should throw an error if user already exists", async () => {
      userRepoMock.findOneBy.mockResolvedValue({ id });

      await expect(
        authService.handleUserSignUp(id, "anotherStrongPassword")
      ).rejects.toThrow("User already exists");
    });
  });

  describe("handleUserSignIn", () => {
    const id = "test@test.test";
    const password = "someStrongPassword";

    it("should throw an error if id or password is missing", async () => {
      await expect(authService.handleUserSignIn("", password)).rejects.toThrow(
        "ID and password are required"
      );
      await expect(authService.handleUserSignIn(id, "")).rejects.toThrow(
        "ID and password are required"
      );
    });

    it("should throw an error if user not found", async () => {
      userRepoMock.findOneBy.mockResolvedValue(null);
      await expect(authService.handleUserSignIn(id, password)).rejects.toThrow(
        "User does not exist"
      );
    });
  });

  describe("getUserData", () => {
    const id = "test@test.com";

    it("should return user data if user exists", async () => {
      userRepoMock.findOneBy.mockResolvedValue({
        id,
        password: "hashedPassword",
      } as User);

      const result: UserDTO | null = await authService.getUserData(id);

      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual({ id });
    });

    it("should return null if user does not exist", async () => {
      userRepoMock.findOneBy.mockResolvedValue(null);

      const result: UserDTO | null = await authService.getUserData(id);

      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toBeNull;
    });
  });

  describe("getSessionData", () => {
    const id = "activeSession";

    it("should return session data if active session exists", async () => {
      sessionRepoMock.findOneBy.mockResolvedValue({ id } as Session);

      const result: Session | null = await authService.getSessionData(id);

      expect(sessionRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual({ id });
    });

    it("should return null if active session does not exist", async () => {
      sessionRepoMock.findOneBy.mockResolvedValue(null);

      const result: Session | null = await authService.getSessionData(id);

      expect(sessionRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toBeNull;
    });
  });

  describe("refresh", () => {
    it("should throw an error if refresh token is invalid", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid refresh token");
      });

      await expect(authService.handleTokenRefresh("badToken")).rejects.toThrow(
        "Invalid refresh token"
      );
    });

    it("should throw an error if session does not exist", async () => {
      const mockPayload = { id: "test@test.test", sessionId: "notexisting" };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      sessionRepoMock.findOneBy.mockResolvedValue(null);

      await expect(authService.handleTokenRefresh("token")).rejects.toThrow(
        "Session not found"
      );
    });

    it("should refresh token successfully if session exists", async () => {
      const userId = "test@test.test";
      const sessionId = "existingSessionId";
      const jwtRefreshSecret = "testRefreshSecret";
      const mockPayload = { id: userId, sessionId: sessionId };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      sessionRepoMock.findOneBy.mockResolvedValue({
        id: sessionId,
      });

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("newAccessToken")
        .mockReturnValueOnce("newRefreshToken");

      const result = await authService.handleTokenRefresh("oldRefreshToken");

      expect(jwt.verify).toHaveBeenCalledWith(
        "oldRefreshToken",
        jwtRefreshSecret
      );

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken",
      });
    });
  });
});
