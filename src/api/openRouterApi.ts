const fetchCompletions = async (prompt: string) => {
  const model = 'deepseek/deepseek-r1:free';
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        reasoning: { exclude: true }
      })
    });
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

const fetchSynonyms = async (word: string) => {
  const prompt = `Сгенерируй 7-15 синонимов для русского слова '${word}' в формате JSON. 
  Структура: { "synonyms": [...] }. 
  Пример для слова 'быстрый': { "synonyms": ["скорый", "стремительный", "проворный", "резвый", "шустрый"] }. 
  Только русские слова.`;

  const data = await fetchCompletions(prompt);
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

  if (!jsonMatch) throw new Error("Invalid response format");
  return JSON.parse(jsonMatch[1]).synonyms as string[];
};

export const OpenRouterApi = {
  fetchSynonyms
}
