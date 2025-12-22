export async function getRandomWord({
  len,
  condition,
  exclude = [],
  impossible = [],
}: {
  len: number;
  condition?: string; // "__가__" 같은 패턴
  exclude?: string[];
  impossible?: string[];
}) {
  try {
    const response = await fetch(`/api/get_random_word`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        len,
        condition: condition ?? null,
        exclude,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error getting word");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get word:", error);
    throw error;
  }
}
