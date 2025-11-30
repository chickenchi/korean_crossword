export async function getRandomWord(len: number) {
  try {
    const response = await fetch(`/api/get_random_word?len=${len}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error getting word");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get word:", error);
    throw error;
  }
}
