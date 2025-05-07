import { IBlockTitleForms } from "@/entities/ConstructorEntities";
import { notifications } from "@mantine/notifications";
import {configDatabase} from "@/entities/configuratorDb";

/**
 * Получает формы слова из API и преобразует их в формат IBlockTitleForms
 * @param phrase Фраза для анализа
 * @returns Объект с формами слова
 */
export const fetchAndPrepareTitleForms = async (phrase: string): Promise<IBlockTitleForms> => {
  try {
    // Получаем API ключ из глобальных настроек
    const settings = await configDatabase.globalSettings.get(1);
    const apiKey = settings?.incLuminApiKey;

    if (!apiKey) {
      notifications.show({
        title: "Ошибка авторизации",
        message: "API ключ для Lumin не настроен",
        color: "red",
      });
      throw new Error("Lumin API key not configured");
    }

    const response = await fetch('http://62.109.2.159:5123/get_cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ phrase })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const formsData = await response.json();

    return {
      nominative: formsData.nomn || phrase,
      genitive: formsData.gent || '',
      dative: formsData.datv || '',
      accusative: formsData.accs || '',
      instrumental: formsData.ablt || '',
      prepositional: formsData.loct || '',
      plural: formsData.plural_nomn || ''
    };

  } catch (error) {
    console.error('Error fetching word forms:', error);
    notifications.show({
      title: "Ошибка запроса",
      message: error instanceof Error ? error.message : "Ошибка при получении форм слова",
      color: "red",
    });

    return {
      nominative: phrase,
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: '',
      plural: ''
    };
  }
};
