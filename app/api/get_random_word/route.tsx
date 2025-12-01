import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { len, condition, exclude = [] } = await req.json();

    if (!len) {
      return NextResponse.json({ error: "Missing len" }, { status: 400 });
    }

    const unit_type = "단어";

    //
    // 0) 패턴(condition) → c1~cN 인덱스 조건으로 변환
    //
    // condition이 null이면 전체 패턴 ("%")로 간주
    const mask = condition ?? "";

    // 예: _가__ → [{pos:2, char:'가'}]
    const indexConditions: { pos: number; char: string }[] = [];

    for (let i = 0; i < mask.length; i++) {
      const ch = mask[i];
      if (ch !== "_" && ch !== "%") {
        // position은 1-based
        indexConditions.push({ pos: i + 1, char: ch });
      }
    }

    //
    // 1) COUNT(*) — 인덱스 기반으로 매우 빠름
    //
    const countResult = await prisma.$queryRaw<{ cnt: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) AS cnt
      FROM Word
      WHERE len = ${len}
        AND unit_type = ${unit_type}
        ${
          exclude.length > 0
            ? Prisma.sql`
          AND word NOT IN (${Prisma.join(exclude)})
        `
            : Prisma.empty
        }
        ${
          indexConditions.length > 0
            ? Prisma.sql`
          ${Prisma.join(
            indexConditions.map(
              (ic) =>
                Prisma.sql`AND c${Prisma.raw(ic.pos.toString())} = ${ic.char}`
            ),
            " "
          )}
        `
            : Prisma.empty
        }
    `);

    const rawCount = countResult[0]?.cnt ?? 0n;
    const count = Number(rawCount);

    if (count === 0) {
      return NextResponse.json(null);
    }

    // offset
    const offset = Math.floor(Math.random() * count);

    //
    // 2) LIMIT offset, 1 로 랜덤 선택
    //
    const result = await prisma.$queryRaw<{ id: number; word: string }[]>(
      Prisma.sql`
        SELECT id, word
        FROM Word
        WHERE len = ${len}
          AND unit_type = ${unit_type}
          ${
            exclude.length > 0
              ? Prisma.sql`AND word NOT IN (${Prisma.join(exclude)})`
              : Prisma.empty
          }
          ${
            indexConditions.length > 0
              ? Prisma.sql`
            ${Prisma.join(
              indexConditions.map(
                (ic) =>
                  Prisma.sql`AND c${Prisma.raw(ic.pos.toString())} = ${ic.char}`
              ),
              " "
            )}
          `
              : Prisma.empty
          }
        LIMIT ${offset}, 1
      `
    );

    return NextResponse.json(result[0] ?? null);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Random fetch error", details: String(error) },
      { status: 500 }
    );
  }
}
