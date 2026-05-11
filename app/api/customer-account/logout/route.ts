import { clearCustomerSession } from "lib/customer-account";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await clearCustomerSession();
  return NextResponse.redirect(new URL("/profile", request.url));
}
