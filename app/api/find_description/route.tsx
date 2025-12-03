import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");

  if (!word) {
    return Response.json({ error: "word가 필요합니다." }, { status: 400 });
  }

  const row = await prisma.word.findFirst({
    where: { word: word },
    select: {
      definition: true,
      part_of_speech: true,
    },
  });

  if (!row) {
    // 결과 없으면 여기서 처리
    return { error: "단어 없음" };
  }

  const definition = row.definition!;

  const match = definition.match(/([가-힣]+)\s*의 어근/);

  if (match) {
    const rootWord = match[1];

    const rootRow = await prisma.word.findFirst({
      where: { word: rootWord },
      select: { definition: true },
    });

    if (rootRow) {
      // definition 전체를 root 정의로 교체
      row.definition = rootRow.definition;
    }
  }

  if (!row) {
    return Response.json({ exists: false }, { status: 200 });
  }

  return Response.json({
    exists: true,
    data: row,
  });
}
