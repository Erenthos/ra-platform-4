import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// -------------------------
// 🔐 Create JWT Token
// -------------------------
export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

// -------------------------
// 🧍 Signup User
// -------------------------
export const signupUser = async (name: string, email: string, password: string, role: "BUYER" | "SUPPLIER") => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });

  const token = generateToken(newUser.id, newUser.role);
  return { user: newUser, token };
};

// -------------------------
// 🔑 Login User
// -------------------------
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  const token = generateToken(user.id, user.role);
  return { user, token };
};

// -------------------------
// 🔎 Verify Token
// -------------------------
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch {
    return null;
  }
};

