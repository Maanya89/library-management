const MemberController = require("../controllers/memberController");

const setMemberRoutes = (app) => {
  const memberController = new MemberController();
  app.get("/api/members", memberController.getMembers.bind(memberController));
};

module.exports = setMemberRoutes;
