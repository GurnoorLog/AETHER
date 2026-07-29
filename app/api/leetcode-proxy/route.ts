import { NextRequest, NextResponse } from "next/server";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

export async function POST(req: NextRequest) {
  const { query, variables } = await req.json();
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
