import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, name, email, password } = await request.json();

    if (!token || !name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate invite
    const invite = await prisma.invite.findUnique({
      where: { token },
    });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match invite" },
        { status: 400 }
      );
    }

    // Check if scout already exists
    const existingScout = await prisma.scout.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingScout) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Create scout
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.scout.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: invite.role,
      },
    });

    // Mark invite as used
    await prisma.invite.update({
      where: { id: invite.id },
      data: { used: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
