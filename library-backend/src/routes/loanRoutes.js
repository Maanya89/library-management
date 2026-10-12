const LoanController = require("../controllers/loanController");

const setLoanRoutes = (app) => {
  const loanController = new LoanController();
  app.get("/api/loans", loanController.getLoans.bind(loanController));
  app.get("/api/loans/stats", loanController.getStats.bind(loanController));
};

module.exports = setLoanRoutes;
