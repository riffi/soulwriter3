import {notifications} from "@mantine/notifications";

const fetchCompletions = async (prompt: string) => {
  //const model = 'deepseek/deepseek-r1:free';
  const model = 'google/gemma-3-12b-it:free';
  //const token = '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'
  const token = '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'
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
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

const fetchParaphrases = async (phrase: string) => {
  try {
    const prompt = `Сгенерируй 4 варианта перефразирования для русской фразы: "${phrase}". 
  Формат: JSON массив с ключом "paraphrases". 
  Пример: { "paraphrases": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"] }. 
  Только русский язык, сохрани исходный смысл.`;

    const data = await fetchCompletions(prompt);
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

    if (!jsonMatch) throw new Error("Invalid response format");
    return JSON.parse(jsonMatch[1]).paraphrases as string[];
  }
  catch (e){
    notifications.show({
      title: "Ошибка",
      message: "Ошибка при получении данных",
      color: "red",
    });
  }
  return [];
};

const fetchSimplifications = async (text: string) => {
  try {
    const prompt = `Упрости и сократи следующий русский текст: "${text}".
Сделай 2 варианта упрощения. Действуй по правилам:
- Убери излишние описания и повторы
- Замени страдательный залог на действительный
- Разбей длинные предложения на короткие
- Упрости сложные грамматические конструкции
- Сохрани основной смысл

Формат ответа: JSON с ключом "simplifications". 
Пример: { "simplifications": ["Вариант 1", "Вариант 2"] }`;

    const data = await fetchCompletions(prompt);
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

    if (!jsonMatch) throw new Error("Invalid response format");
    return JSON.parse(jsonMatch[1]).simplifications as string[];
  } catch (e) {
    notifications.show({
      title: "Ошибка",
      message: "Ошибка при упрощении текста",
      color: "red",
    });
  }
  return [];
};

const fetchSpellingCorrection = async (text: string) => {
  try {
    const prompt = `Исправь орфографические и пунктуационные ошибки в следующем русском тексте: "${text}". 
Ответ пришли в формате JSON с ключом "correction". 
Пример: { "correction": "Исправленный текст здесь" }. 
Не добавляй комментарии, только исправленный текст.`;

    const data = await fetchCompletions(prompt);
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

    if (!jsonMatch) throw new Error("Invalid response format");
    return JSON.parse(jsonMatch[1]).correction as string;
  } catch (e) {
    notifications.show({
      title: "Ошибка",
      message: "Ошибка при проверке орфографии",
      color: "red",
    });
    return text; // Возвращаем оригинальный текст в случае ошибки
  }
};

export const OpenRouterApi = {
  fetchSynonyms,
  fetchParaphrases,
  fetchSimplifications,
  fetchSpellingCorrection
}
