export class YandexSpellerApi {
  static async fetchSpellingCorrection(text: string): Promise<any[]> {
    const url = `https://speller.yandex.net/services/spellservice.json/checkText?text=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Spelling check failed');
    return response.json();
  }
}
