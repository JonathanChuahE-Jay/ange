import { BACKEND_VERSION, FRONTEND_VERSION } from "@/lib/versions";

export async function GET() {
  return Response.json({ backendVersion: BACKEND_VERSION, frontendVersion: FRONTEND_VERSION });
}
