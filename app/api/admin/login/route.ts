import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { clearAdminSession, setAdminSession } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1) }).optional();

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success || !parsed.data?.password) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (parsed.data.password !== env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    setAdminSession();
    return NextResponse.json({ message: "Admin logged in" });
  }

  const formData = await req.formData().catch(() => null);
  if (formData?.get("logout")) {
    clearAdminSession();
    return NextResponse.json({ message: "Logged out" });
  }

  const password = formData?.get("password");
  if (typeof password !== "string" || password !== env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  setAdminSession();
  return NextResponse.json({ message: "Admin logged in" });
}
