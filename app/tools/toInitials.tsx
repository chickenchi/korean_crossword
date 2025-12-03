export const toInitials = (word: string) => {
  const INITIAL = [
    "ㄱ",
    "ㄲ",
    "ㄴ",
    "ㄷ",
    "ㄸ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅃ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅉ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];

  let result = "";

  for (const ch of word) {
    const code = ch.charCodeAt(0);

    // 한글 음절 여부 검사 (가~힣)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      result += INITIAL[idx];
    } else {
      // 한글 아니면 그대로
      result += ch;
    }
  }

  return result;
};
