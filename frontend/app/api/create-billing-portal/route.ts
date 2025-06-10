import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call Clerk's billing portal API
  const res = await fetch(`https://api.clerk.com/v1/billing/portal_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ url: data.url });
}
