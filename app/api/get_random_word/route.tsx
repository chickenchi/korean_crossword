import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const len = Number(searchParams.get("len"));

    if (!len) {
      return NextResponse.json({ error: "Missing len" }, { status: 400 });
    }

    const unit_type = "단어";

    // 1) 범위 구하기: min/max id
    const range = await prisma.word.aggregate({
      where: {
        len,
        unit_type,
      },
      _min: { id: true },
      _max: { id: true },
    });

    const minId = range._min.id;
    const maxId = range._max.id;

    if (!minId || !maxId) {
      return NextResponse.json({ error: "No data" }, { status: 404 });
    }

    // 2) 랜덤 ID 생성
    const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;

    // 3) 첫 번째 후보 (randomId 이상)
    const topCandidate = await prisma.word.findFirst({
      where: {
        id: { gte: randomId },
        len,
        unit_type,
      },
      orderBy: { id: "asc" },
      select: { id: true, word: true },
    });

    if (topCandidate) {
      return NextResponse.json(topCandidate, { status: 200 });
    }

    // 4) 없으면 (randomId 아래에서 다음 것 찾기)
    const fallbackCandidate = await prisma.word.findFirst({
      where: {
        id: { lt: randomId },
        len,
        unit_type,
      },
      orderBy: { id: "asc" },
      select: { id: true, word: true },
    });

    if (fallbackCandidate) {
      return NextResponse.json(fallbackCandidate, { status: 200 });
    }

    return NextResponse.json(
      { error: "No word found (unexpected)" },
      { status: 404 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Random fetch error", details: String(error) },
      { status: 500 }
    );
  }
}
