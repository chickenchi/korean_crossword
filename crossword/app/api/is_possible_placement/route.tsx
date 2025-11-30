import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { length, placementInitial, crossedLength, crossedPlacement } =
    await req.json();

  const tableMap: Record<number, string> = {
    2: "twoinitial",
    3: "threeinitial",
    4: "fourinitial",
    5: "fiveinitial",
    6: "sixinitial",
  };

  const tableName = tableMap[length];
  if (!tableName) {
    return Response.json({ possible: false });
  }

  const table = (prisma as any)[tableName];
  if (!table) {
    return Response.json({ possible: false });
  }

  // 해당 글자(ch) row 조회
  const row = await table.findUnique({
    where: { ch: placementInitial },
  });

  if (!row) {
    return Response.json({ possible: false });
  }

  // ch1, ch2, ch3 ... 선택
  const colName = `ch${crossedPlacement}` as keyof typeof row;
  const cell = row[colName] as string | null;

  if (!cell) {
    return Response.json({ possible: false });
  }

  // allowed lengths
  const allowedLens = cell
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));

  const possible = allowedLens.includes(crossedLength);

  return Response.json({ possible });
}
