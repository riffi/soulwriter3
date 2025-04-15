import {IBlockTitleForms} from "@/entities/ConstructorEntities";

/**
 * Получает формы слова из API и преобразует их в формат IBlockTitleForms
 * @param phrase Фраза для анализа
 * @returns Объект с формами слова
 */
export const fetchAndPrepareTitleForms = async (phrase: string): Promise<IBlockTitleForms> => {
  try {
    const response = await fetch('http://62.109.2.159:5123/parse_phrase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 4f5d6e7a8b9c0d1e2f3a4b5c6d7e8f9a'
      },
      body: JSON.stringify({ phrase })
    });

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
    // Возвращаем формы по умолчанию в случае ошибки
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
