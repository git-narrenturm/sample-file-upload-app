import { AuthService } from "@srv/AuthService";
import { AuthController } from "@controllers/AuthController";

describe("AuthController", () => {
  let authServiceMock: jest.Mocked<AuthService>;
  let authController: AuthController;
  let req: any;
  let res: any;

  beforeEach(() => {
    authServiceMock = {
      handleUserSignUp: jest.fn(),
      handleUserSignIn: jest.fn(),
      getUserData: jest.fn(),
      getSessionData: jest.fn(),
    } as any;

    authController = new AuthController();

    req = {
      body: undefined,
      user: undefined,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("signUp", () => {
    it("should return created user data and result 201 if user registration is successful", async () => {
      req.body = { id: "test@test.test", password: "someSecurePassword" };

      const mockResult = { id: req.body.id };
      const spy = jest
        .spyOn(AuthService.prototype, "handleUserSignUp")
        .mockResolvedValue(mockResult);

      await authController.signUp(req, res);

      expect(spy).toHaveBeenCalledWith(req.body.id, req.body.password);

      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should throw an error and return 400 status code if registration is unsuccessful", async () => {
      req.body = { id: "test@test.test", password: "someSecurePassword" };

      const mockError = new Error("User already exists");
      const spy = jest
        .spyOn(AuthService.prototype, "handleUserSignUp")
        .mockRejectedValue(mockError);

      await authController.signUp(req, res);

      expect(spy).toHaveBeenCalledWith(req.body.id, req.body.password);
      expect(res.json).toHaveBeenCalledWith({ error: mockError.message });
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("signIn", () => {
    it("should return user data and 200 status if user signin is successful", async () => {
      req.body = { id: "test@test.test", password: "someSecurePassword" };

      const mockResult = {
        accessToken: "accessToken",
        refreshToken: "refreshToken",
      };
      const spy = jest
        .spyOn(AuthService.prototype, "handleUserSignIn")
        .mockResolvedValue(mockResult);

      await authController.signIn(req, res);

      expect(spy).toHaveBeenCalledWith(req.body.id, req.body.password);

      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should throw an error and return 400 status code if singin is unsuccessful", async () => {
      req.body = { id: "test@test.test", password: "someSecurePassword" };

      const mockError = new Error("User does not exist");
      const spy = jest
        .spyOn(AuthService.prototype, "handleUserSignIn")
        .mockRejectedValue(mockError);

      await authController.signIn(req, res);

      expect(spy).toHaveBeenCalledWith(req.body.id, req.body.password);
      expect(res.json).toHaveBeenCalledWith({ error: mockError.message });
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("info", () => {
    it("should throw an error and return 401 status code if unautorized", async () => {
      req.body = { id: "test@test.test", password: "someSecurePassword" };

      await authController.info(req, res);

      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should throw an error and return 400 status code if active session is not found", async () => {
      req.user = { id: "test@test.test", session: "inactiveSession" };

      const spy = jest
        .spyOn(AuthService.prototype, "getSessionData")
        .mockResolvedValue(null);

      await authController.info(req, res);

      expect(spy).toHaveBeenCalledWith(req.user.session);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Active session not found",
      });
    });

    it("should return user data and 200 status code if user data retrieved successfully", async () => {
      req.user = { id: "test@test.test", session: "activeSession" };

      const sessionSpy = jest
        .spyOn(AuthService.prototype, "getSessionData")
        .mockResolvedValue({ id: "activeSessionId" } as any);

      const userSpy = jest
        .spyOn(AuthService.prototype, "getUserData")
        .mockResolvedValue({ id: req.user.id } as any);

      await authController.info(req, res);

      expect(sessionSpy).toHaveBeenCalledWith(req.user.session);
      expect(userSpy).toHaveBeenCalledWith(req.user.id);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: req.user.id });
    });
  });
});
