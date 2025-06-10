import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return new NextResponse("Account deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting account:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
