import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// GET all invites
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}

// POST create invite
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if scout already exists
    const existingScout = await prisma.scout.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingScout) {
      return NextResponse.json(
        { error: "A scout with this email already exists" },
        { status: 400 }
      );
    }

    // Check if invite already exists (and not used)
    const existingInvite = await prisma.invite.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingInvite && !existingInvite.used) {
      return NextResponse.json(
        { error: "An active invite for this email already exists" },
        { status: 400 }
      );
    }

    // Delete used invite if exists (so we can create new one with same email)
    if (existingInvite && existingInvite.used) {
      await prisma.invite.delete({ where: { id: existingInvite.id } });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await prisma.invite.create({
      data: {
        email: email.toLowerCase(),
        role: role || "scout",
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://bacau-scout-production.up.railway.app";
    const inviteLink = `${baseUrl}/register?token=${token}`;

    return NextResponse.json({ invite, inviteLink });
  } catch (error) {
    console.error("Failed to create invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
