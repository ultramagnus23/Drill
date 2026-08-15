import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { resolve } from "path";

// Serves the locally generated Brain dataset (data/brain/synapses.json,
// gitignored, produced by `npm run generate:brain`). This route only ever
// reads a file already on disk — nothing here fetches or stores anything
// remotely, and the data never touches /public or git.
export async function GET() {
  const filePath = resolve(process.cwd(), "data/brain/synapses.json");
  try {
    const raw = await readFile(filePath, "utf8");
    return new NextResponse(raw, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "No brain data yet. Run `npm run generate:brain` after importing your export." },
      { status: 404 }
    );
  }
}
