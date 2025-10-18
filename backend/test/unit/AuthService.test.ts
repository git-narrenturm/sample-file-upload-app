import { User } from "@entities/User";

import { AuthService } from "@srv/AuthService";

describe("AuthService", () => {
  let authService: AuthService;
  let userRepoMock: any;

  beforeEach(() => {
    userRepoMock = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    authService = new AuthService(userRepoMock);
  });

  describe("Sign-up method", () => {
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

  describe("Sign-in method", () => {
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
});
