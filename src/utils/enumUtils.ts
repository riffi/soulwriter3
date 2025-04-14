export function createOptionsFromEnums<
    T extends Record<string, string | number>,
    U extends Record<string, string>
>(valueEnum: T, labelEnum: U): Array<{ value: T[keyof T]; label: string }> {
  return (Object.keys(valueEnum) as Array<keyof T>)
  .filter((key) => isNaN(Number(key))) // Фильтруем числовые ключи (актуально для числовых enum'ов)
  .map((key) => ({
    value: valueEnum[key],
    label: labelEnum[key as keyof U] || String(valueEnum[key]),
  }));
}
