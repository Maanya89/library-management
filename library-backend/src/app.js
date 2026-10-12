const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const setAuthRoutes = require("./routes/authRoutes");
const setBookRoutes = require("./routes/bookRoutes");
const setLoanRoutes = require("./routes/loanRoutes");
const setMemberRoutes = require("./routes/memberRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

setAuthRoutes(app);
setBookRoutes(app);
setLoanRoutes(app);
setMemberRoutes(app);

module.exports = app;
