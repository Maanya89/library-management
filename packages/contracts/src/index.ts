import { z } from "zod";

const nonEmptyText = (max: number) =>
  z.string().trim().min(1).max(max);
const bcryptPassword = (minimum: number) =>
  z.string().min(minimum).max(128)
    .refine((value) => new TextEncoder().encode(value).byteLength <= 72, "Password must not exceed 72 UTF-8 bytes.");

export const loginSchema = z.object({
  email: z.email().max(254),
  password: bcryptPassword(1),
});

export const staffPasswordSchema = bcryptPassword(12);

export const createBookSchema = z.object({
  title: nonEmptyText(255),
  author: nonEmptyText(255),
  genre: nonEmptyText(80),
  isbn: z.string().trim().max(20).optional().or(z.literal("")),
  copies: z.number().int().min(1).max(999),
});

export const createMemberSchema = z.object({
  name: nonEmptyText(150),
  email: z.email().max(254),
});

export const createLoanSchema = z.object({
  bookId: z.uuid(),
  memberId: z.uuid(),
  dueDate: z.iso.date(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "librarian" | "admin";
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  isbn: string | null;
  copies: number;
  availableCopies: number;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  joinedAt: string;
  booksOut: number;
}

export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  bookTitle: string;
  bookAuthor: string;
  memberName: string;
  checkedOut: string;
  dueDate: string;
  returnedOn: string | null;
  status: "active" | "returned";
}

export interface LibraryStats {
  titles: number;
  copies: number;
  availableCopies: number;
  activeLoans: number;
  dueToday: number;
  overdue: number;
  activeMembers: number;
  totalLoans: number;
  returnedLoans: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
