import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "duster.cards.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Failed to load cards:", e);
    return NextResponse.json([], { status: 200 });
  }
}
