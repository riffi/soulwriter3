import { IBlockTitleForms } from "@/entities/ConstructorEntities";
import { notifications } from "@mantine/notifications";
import { IWarningGroup, IWarningKind } from "@/components/shared/RichEditor/types";
import { generateUUID } from "@/utils/UUIDUtils";
import {getIncLuminApiKey} from "@/stores/apiSettingsStore/apiSettingsStore";

const BASE_API_URL = 'https://ml.inclumin.ru';

export class InkLuminApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InkLuminApiError";
  }
}

const fetchWithAuth = async (url: string, body: object) => {
  try {
    const apiKey = getIncLuminApiKey();

    if (!apiKey) {
      throw new InkLuminApiError("Lumin API key not configured");
    }

    const response = await fetch(`${BASE_API_URL}/${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new InkLuminApiError(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error instanceof InkLuminApiError) {
      throw error;
    }
    throw new InkLuminApiError(error.message);
  }
};

/**
 * Получает формы слова из API и преобразует их в формат IBlockTitleForms
 * @param phrase Фраза для анализа
 * @returns Объект с формами слова
 */
export const fetchAndPrepareTitleForms = async (phrase: string): Promise<IBlockTitleForms> => {
  try {
    const formsData = await fetchWithAuth('get_cases', { phrase });

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
    throw new InkLuminApiError(error.message);
  }
};

export const fetchRepeats = async (text: string): Promise<IWarningGroup[]> => {
  try {
    const data = await fetchWithAuth('find_repeats', {
      text,
      window_size: 10,
      window_size_tech_words: 1
    });

    const groups: IWarningGroup[] = [];
    data.repeatData.forEach((rawGroup: any, index: number) => {
      const group: IWarningGroup = {
        groupIndex: String(index),
        warningKind: IWarningKind.REPEAT,
        warnings: rawGroup.repeats.map((repeat: any) => ({
          id: generateUUID(),
          from: repeat.startPosition + 1,
          to: repeat.endPosition + 2,
          groupIndex: String(index),
          text: repeat.word,
          kind: IWarningKind.REPEAT
        }))
      };
      groups.push(group);
    });

    return groups;
  } catch (error) {
    console.error('Error checking repeats:', error);
    notifications.show({
      title: "Ошибка запроса",
      message: error instanceof Error ? error.message : "Ошибка при проверке повторений",
      color: "red",
    });
    return [];
  }
};

export const fetchCliches = async (text: string): Promise<IWarningGroup[]> => {
  try {
    const data = await fetchWithAuth('analyze_cliches', { text });

    const groups: IWarningGroup[] = [];
    data.data.forEach((warning: any, index: number) => {
      const group: IWarningGroup = {
        groupIndex: String(index),
        warningKind: IWarningKind.CLICHE,
        warnings: [{
          id: generateUUID(),
          from: warning.start + 1,
          to: warning.end + 1,
          groupIndex: String(index),
          text: warning.text,
          kind: IWarningKind.CLICHE,
          active: false
        }]
      };
      groups.push(group);
    });

    return groups;
  } catch (error) {
    console.error('Error checking cliches:', error);
    notifications.show({
      title: "Ошибка запроса",
      message: error instanceof Error ? error.message : "Ошибка при проверке штампов",
      color: "red",
    });
    return [];
  }
};

export const InkLuminApi = {
  fetchAndPrepareTitleForms,
  fetchRepeats,
  fetchCliches
};
