const BookController = require("../controllers/bookController");

const setBookRoutes = (app) => {
  const bookController = new BookController();
  app.get("/api/books", bookController.getBooks.bind(bookController));
  app.post("/api/books", bookController.addBook.bind(bookController));
};

module.exports = setBookRoutes;
