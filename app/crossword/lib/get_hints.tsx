export async function getHints(word: string) {
  try {
    const response = await fetch(`/api/get_hints?word=${word}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error getting description");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get description:", error);
    throw error;
  }
}
