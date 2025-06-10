import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { userId, has } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Default to free plan
  let dailyLimit = 25;
  // If user has pro plan, increase limit
  if (has && has({ plan: "pro_user" })) {
    dailyLimit = 50;
  }
  const today = new Date().toISOString().slice(0, 10);
  const storePath = path.join(
    process.cwd(),
    "generated",
    "message-limits.json"
  );
  let store: Record<string, any> = {};
  try {
    const raw = await fs.readFile(storePath, "utf-8");
    store = JSON.parse(raw);
  } catch (e) {
    store = {};
  }
  const used = store[userId]?.[today] || 0;
  return Response.json({
    remaining: Math.max(0, dailyLimit - used),
    dailyLimit,
  });
}
