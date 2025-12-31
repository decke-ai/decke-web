import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return auth0.startInteractiveLogin({
    authorizationParameters: {
      redirect_uri: `${request.nextUrl.origin}/auth/callback`,
    },
  });
}
