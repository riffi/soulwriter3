import {notifications} from "@mantine/notifications";
import {getOpenRouterKey, useApiSettingsStore} from "@/stores/apiSettingsStore/apiSettingsStore";
import {IBlock} from "@/entities/ConstructorEntities";
import {KnowledgeBaseEntity} from "@/entities/KnowledgeBaseEntities";


const fetchCompletions = async (prompt: string) => {
  try {
    const token = getOpenRouterKey();
    const model = useApiSettingsStore.getState().currentOpenRouterModel;

    if (!token) {
      throw new Error("Заполните OpenRouter API в настройках");
    }

    if (!model) {
      throw new Error("Выберите модель OpenRouter API в настройках");
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

const fetchRhymes = async (word: string) => {
  const prompt = `Сгенерируй 7-15 рифм для русского слова '${word}' в формате JSON. 
  Структура: { "rhymes": [...] }. 
  Пример для слова 'дом': { "rhymes": ["том", "сом", "ком", "льдом", "котом"] }. 
  Только русские слова, включай разные типы рифм (точные, ассонансы и т.д.).;`

  const data = await fetchCompletions(prompt);
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

  if (!jsonMatch) throw new Error("Invalid response format");
  return JSON.parse(jsonMatch[1]).rhymes as string[];
};






const fetchKnowledgeBaseEntities = async (sceneContent: string, block: IBlock): Promise<KnowledgeBaseEntity[]> => {
  const prompt = `Проанализируй  текст сцены

Найди в тексте все сущности типа "${block.title}" (описание: "${block.description}").
Для каждой найденной сущности извлеки краткое название (title), общее описание сущности (description), описание из контекста сцены (sceneDescription).
Верни результат в формате JSON массива объектов. Каждый объект должен иметь поля "title" (строка) и "description" (строка).

Пример ответа для "${block.title}":
[
  { "title": "Название сущности 1", "description": "Описание сущности 1 из текста", "sceneDescription": "Описание из контекста сцены" },
  { "title": "Название сущности 2", "description": "Описание сущности 2 из текста", "sceneDescription": "Описание из контекста сцены" }
]

Если сущности не найдены, верни пустой массив [].

Текст сцены:
"""
${sceneContent}
"""
`;

  try {
    const data = await fetchCompletions(prompt);
    let content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Ответ API не содержит ожидаемого поля 'content'.");
    }

    // Извлечение JSON из обрамления ```json ... ``` или просто ``` ... ```
    const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      content = jsonMatch[1];
    } else {
      // Попытка извлечь JSON, если он не обрамлен в ```json ... ```, а просто является строкой JSON
      // Это может быть полезно, если LLM иногда возвращает "голый" JSON
      content = content.trim();
      if (!content.startsWith('[') || !content.endsWith(']')) {
        // Если это не массив, и не было ```json ... ```, считаем формат неверным.
        // Можно добавить более сложную проверку, если ожидаются и объекты {}.
        console.warn("Ответ API не содержит ожидаемого JSON массива в ```json ... ``` или в чистом виде. Попытка парсинга как есть.");
      }
    }

    const parsedResult = JSON.parse(content);

    if (!Array.isArray(parsedResult)) {
      notifications.show({
        title: "Ошибка обработки данных",
        message: "Полученные данные от AI не являются массивом.",
        color: "orange",
      });
      return [];
    }

    // Дополнительная проверка структуры объектов в массиве (опционально, но рекомендуется)
    if (parsedResult.length > 0) {
      const firstItem = parsedResult[0];
      if (typeof firstItem.title !== 'string' || typeof firstItem.description !== 'string') {
        notifications.show({
          title: "Ошибка структуры данных",
          message: "Объекты в массиве от AI не имеют необходимых полей 'title' или 'description'.",
          color: "orange",
        });
        return [];
      }
    }

    return parsedResult as KnowledgeBaseEntity[];

  } catch (error: any) {
    console.error("Ошибка при получении или обработке сущностей базы знаний:", error);
    notifications.show({
      title: "Ошибка API",
      message: error.message || "Не удалось получить сущности для базы знаний. Проверьте консоль для деталей.",
      color: "red",
    });
    return [];
  }
};


export const OpenRouterApi = {
  fetchSynonyms,
  fetchParaphrases,
  fetchSimplifications,
  fetchSpellingCorrection,
  fetchRhymes,
  fetchKnowledgeBaseEntities // Add new function here
}
