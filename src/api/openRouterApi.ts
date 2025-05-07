import {notifications} from "@mantine/notifications";
import {configDatabase} from "@/entities/configuratorDb";

const fetchCompletions = async (prompt: string) => {
  const model = 'google/gemma-3-12b-it:free';

  try {
    // Получаем текущие настройки из базы данных
    const settings = await configDatabase.globalSettings.get(1);
    const token = settings?.openRouterKey;

    if (!token) {
      throw new Error("OpenRouter API key not configured");
    }

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

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
  catch (error){
    notifications.show({
      title: "Ошибка",
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
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
  } catch (error) {
    notifications.show({
      title: "Ошибка",
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
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
  } catch (error) {
    notifications.show({
      title: "Ошибка",
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
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
