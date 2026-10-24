import { NextResponse, connection } from "next/server";
import { isLive } from "@/lib/ica";

// Public and cheap: reports only whether the app is live or in demo mode.
// Use `npm run ica-check` to list the available ICA models.
export async function GET() {
  await connection(); // read the environment at request time, not at build time
  return NextResponse.json({ ok: true, mode: isLive() ? "live" : "demo" });
}
