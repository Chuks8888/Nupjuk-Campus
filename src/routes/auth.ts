import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { transporter } from "../mail";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/send-code", async (req, res) => {
  try {
    const { kaistEmail } = req.body;

    if (!kaistEmail) {
      return res.status(400).json({ error: "Email required" });
    }

    if (!kaistEmail.endsWith("@kaist.ac.kr")) {
      return res.status(400).json({ error: "KAIST email required" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailVerificationCode.create({
      data: {
        email: kaistEmail,
        code,
        expiresAt,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: kaistEmail,
      subject: "Nupjuk Verification Code",
      text: `Your verification code is: ${code}

      This code will expire in 5 minutes.`,
    });

    return res.json({
      message: "Verification code sent",
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send code" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { kaistEmail, password, code } = req.body;

    if (!kaistEmail || !password || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email: kaistEmail,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        kaistEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        kaistEmail,
        passwordHash,
      },
      select: {
        id: true,
        studentId: true,
        kaistEmail: true,
        displayName: true,
        createdAt: true,
      },
    });

    await prisma.emailVerificationCode.update({
      where: {
        id: verification.id,
      },
      data: {
        used: true,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        kaistEmail: user.kaistEmail,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { kaistEmail, password } = req.body;

    if (!kaistEmail || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await prisma.user.findUnique({
      where: { kaistEmail },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        kaistEmail: user.kaistEmail,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    return res.json({
      token,

      user: {
        id: user.id,
        studentId: user.studentId,
        kaistEmail: user.kaistEmail,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
