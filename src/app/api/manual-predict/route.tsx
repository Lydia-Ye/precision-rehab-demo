import { NextResponse } from "next/server";
import { generateManualScheduleResults } from "@/mock/resultsGenerator";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { params, y_init, past_actions, future_actions } = data;

    // Generate predictions for the manual schedule
    const results = generateManualScheduleResults(
      y_init,
      past_actions,
      future_actions,
      params
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Manual prediction error:", error);
    return NextResponse.json({ error: "Failed to generate manual predictions" }, { status: 500 });
  }
} 