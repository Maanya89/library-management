import test from "node:test";
import assert from "node:assert/strict";
import { createBookSchema, createLoanSchema, createMemberSchema, loginSchema } from "../src/index.ts";

test("login input validates email and bounds password length", () => {
  assert.equal(loginSchema.safeParse({ email: "librarian@example.com", password: "correct horse battery staple" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "not-an-email", password: "pw" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "librarian@example.com", password: "a".repeat(73) }).success, false);
});

test("book input enforces bounded copy counts and trimmed required fields", () => {
  assert.equal(createBookSchema.safeParse({ title: "Shelf", author: "Author", genre: "Fiction", copies: 2 }).success, true);
  assert.equal(createBookSchema.safeParse({ title: " ", author: "Author", genre: "Fiction", copies: 0 }).success, false);
});

test("member email is normalized by the service and validated at the boundary", () => {
  assert.equal(createMemberSchema.safeParse({ name: "Reader", email: "reader@example.com" }).success, true);
  assert.equal(createMemberSchema.safeParse({ name: "Reader", email: "invalid" }).success, false);
});

test("loan input requires UUID identifiers and an ISO calendar date", () => {
  assert.equal(createLoanSchema.safeParse({
    bookId: "d0105efc-512e-4c94-887c-b99ec641c254",
    memberId: "d0105efc-512e-4c94-887c-b99ec641c255",
    dueDate: "2026-10-26",
  }).success, true);
  assert.equal(createLoanSchema.safeParse({ bookId: "1", memberId: "2", dueDate: "tomorrow" }).success, false);
});
