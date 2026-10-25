// Garsonun tek dokunuşla ekleyebileceği hazır notlar.
export const FOOD_NOTES = ['Az pişmiş', 'Acısız', 'Soğansız', 'Az tuzlu', 'Sos ayrı'];
export const DRINK_NOTES = ['Buzsuz', 'Limonlu', 'Pipetsiz'];

export function quickNotesFor(categoryName: string | undefined): string[] {
  return categoryName?.toLocaleLowerCase('tr').includes('içecek') ? DRINK_NOTES : FOOD_NOTES;
}
