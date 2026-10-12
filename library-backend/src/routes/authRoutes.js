const AuthController = require("../controllers/authController");

const setAuthRoutes = (app) => {
  const authController = new AuthController();
  app.post("/api/auth/login", authController.loginUser.bind(authController));
};

module.exports = setAuthRoutes;
