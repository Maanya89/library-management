const bcrypt = require("bcryptjs");
bcrypt.hash("mypassword123", 12, (err, hash) => {
  console.log("Your new hash is:", hash);
});
