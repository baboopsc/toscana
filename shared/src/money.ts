import type { Kurus, OrderItemStatus, OrderTotals } from './types.js';

// Para ve KDV hesapları tek yerde: kasa ekranının gösterdiği toplam ile
// sunucunun tahsil ettiği tutar aynı fonksiyonlardan çıkar.

export interface PricedModifier {
  price: Kurus;
}

export interface PricedLine {
  unitPrice: Kurus;
  modifiers: PricedModifier[];
  quantity: number;
  paidQuantity: number;
  vatRate: number;
  status: OrderItemStatus;
}

/** Bir adedin fiyatı: ürün fiyatı + seçilen ekstralar (KDV dahil). */
export function unitTotal(unitPrice: Kurus, modifiers: PricedModifier[]): Kurus {
  return modifiers.reduce((sum, m) => sum + m.price, unitPrice);
}

/** Satır tutarı: (ürün + ekstralar) × adet. */
export function lineTotal(line: { unitPrice: Kurus; modifiers: PricedModifier[]; quantity: number }): Kurus {
  return unitTotal(line.unitPrice, line.modifiers) * line.quantity;
}

/** KDV dahil tutarın içindeki KDV: round(toplam × oran / (100 + oran)). */
export function vatFromGross(gross: Kurus, rate: number): Kurus {
  if (rate <= 0 || gross === 0) return 0;
  return Math.round((gross * rate) / (100 + rate));
}

/**
 * Adisyon toplamları. İptal edilen kalemler toplama girmez.
 * KDV, aynı orandaki kalemlerin toplamı üzerinden tek seferde yuvarlanır.
 */
export function computeTotals(lines: PricedLine[]): OrderTotals {
  const grossByRate = new Map<number, Kurus>();
  let paid = 0;

  for (const line of lines) {
    if (line.status !== 'ACTIVE') continue;
    const unit = unitTotal(line.unitPrice, line.modifiers);
    grossByRate.set(line.vatRate, (grossByRate.get(line.vatRate) ?? 0) + unit * line.quantity);
    paid += unit * line.paidQuantity;
  }

  let gross = 0;
  let vat = 0;
  for (const [rate, rateGross] of grossByRate) {
    gross += rateGross;
    vat += vatFromGross(rateGross, rate);
  }

  return { gross, vat, net: gross - vat, paid, remaining: gross - paid };
}

/** Aktif kalemlerde kullanılan KDV oranları, küçükten büyüğe. */
export function vatRatesOf(lines: Pick<PricedLine, 'vatRate' | 'status'>[]): number[] {
  const rates = new Set<number>();
  for (const line of lines) if (line.status === 'ACTIVE') rates.add(line.vatRate);
  return [...rates].sort((a, b) => a - b);
}

const wholeFormatter = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Kuruşu okunur TL metnine çevirir.
 * Varsayılan: 25000 → "250 TL", 3545 → "35,45 TL". fixed: her zaman iki ondalık.
 */
export function formatTL(amount: Kurus, options: { fixed?: boolean } = {}): string {
  const lira = amount / 100;
  if (!options.fixed && amount % 100 === 0) return `${wholeFormatter.format(lira)} TL`;
  return `${decimalFormatter.format(lira)} TL`;
}

/** "45,50" veya "45.50" gibi kullanıcı girişini kuruşa çevirir; geçersizse null. */
export function parseTL(input: string): Kurus | null {
  const cleaned = input.trim().replace(/\s|TL/gi, '');
  if (cleaned === '') return null;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}
