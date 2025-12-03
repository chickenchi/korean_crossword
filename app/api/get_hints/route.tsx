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
      origin_word: true,
      examples: true,
      subject: true,
      proverb: true,
      idiom: true,
      related_words: true,
    },
  });

  if (!row) {
    return Response.json({ exists: false }, { status: 200 });
  }

  return Response.json({
    exists: true,
    data: row,
  });
}
