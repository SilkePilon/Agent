import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const returnUrl = req.headers.get("origin") || "http://localhost:3000";

    const clerk = await clerkClient();
    // @ts-expect-error: Property 'billingPortal' does not exist on type 'ClerkClient'.
    const billingPortalSession = await clerk.billingPortal.create({
      userId,
      returnUrl,
    });

    return NextResponse.json(
      { url: billingPortalSession.url },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
