export async function isPossiblePlace(params: {
  length: number; // 단어 길이
  placementInitial: string; // '가', '붕', '간' 등
  crossedLength: number; // 상대 단어 길이
  crossedPlacement: number; // 상대 단어 기준 교차 자리 (1-based)
}) {
  try {
    const response = await fetch(`/api/is_possible_placement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
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
