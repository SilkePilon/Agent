import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const returnUrl = req.headers.get("origin") || "http://localhost:3000";

    const billingPortalSession = await clerkClient.billingPortal.create({ userId, returnUrl });

    return NextResponse.json({ url: billingPortalSession.url }, { status: 200 });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}