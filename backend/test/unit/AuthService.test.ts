import { User } from "@entities/User";

import { AuthService } from "@srv/AuthService";

import { UserDTO } from "@customtypes/authTypes";

describe("AuthService", () => {
  let authService: AuthService;
  let userRepoMock: any;
  let sessionRepoMock: any;

  beforeEach(() => {
    userRepoMock = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    authService = new AuthService(userRepoMock, sessionRepoMock);
  });

  describe("handleUserSignUp", () => {
    const id = "test@test.test";
    const password = "someStrongPassword";

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
      userRepoMock.save.mockResolvedValue(true);

      const result = await authService.handleUserSignUp(id, password);

      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual({ message: "User successfully created" });
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
});
