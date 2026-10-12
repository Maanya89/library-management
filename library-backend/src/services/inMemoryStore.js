export class InMemoryStore {
    constructor() {
        this.users = [];
        this.books = [];
        this.loans = [];
    }

    addUser(user) {
        this.users.push(user);
    }

    getUser(username) {
        return this.users.find(user => user.username === username);
    }

    addBook(book) {
        this.books.push(book);
    }

    getBooks() {
        return this.books;
    }

    deleteBook(bookId) {
        this.books = this.books.filter(book => book.id !== bookId);
    }

    issueBook(loan) {
        this.loans.push(loan);
    }

    returnBook(loanId) {
        this.loans = this.loans.filter(loan => loan.id !== loanId);
    }

    getLoans() {
        return this.loans;
    }
}