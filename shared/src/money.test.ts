import { describe, expect, it } from 'vitest';
import { computeTotals, formatTL, lineTotal, parseTL, vatFromGross, type PricedLine } from './money.js';

const parmesan = { price: 4000 };

function line(overrides: Partial<PricedLine>): PricedLine {
  return {
    unitPrice: 0,
    modifiers: [],
    quantity: 1,
    paidQuantity: 0,
    vatRate: 10,
    status: 'ACTIVE',
    ...overrides,
  };
}

describe('money', () => {
  it('Alfredo + Parmesan + Coca Cola = 390 TL, KDV 35,45, ara toplam 354,55', () => {
    const totals = computeTotals([
      line({ unitPrice: 25000, modifiers: [parmesan] }),
      line({ unitPrice: 10000 }),
    ]);
    expect(totals.gross).toBe(39000);
    expect(totals.vat).toBe(3545);
    expect(totals.net).toBe(35455);
    expect(totals.remaining).toBe(39000);
  });

  it('iptal edilen kalem toplama girmez', () => {
    const totals = computeTotals([
      line({ unitPrice: 10000, quantity: 2 }),
      line({ unitPrice: 10000, quantity: 1, status: 'VOID' }),
    ]);
    expect(totals.gross).toBe(20000);
  });

  it('kısmi ödeme kalanı doğru hesaplar', () => {
    const totals = computeTotals([line({ unitPrice: 10000, quantity: 3, paidQuantity: 1 })]);
    expect(totals.paid).toBe(10000);
    expect(totals.remaining).toBe(20000);
  });

  it('farklı KDV oranları ayrı yuvarlanır', () => {
    const totals = computeTotals([
      line({ unitPrice: 25000, vatRate: 10 }),
      line({ unitPrice: 30000, vatRate: 20 }),
    ]);
    expect(totals.vat).toBe(vatFromGross(25000, 10) + vatFromGross(30000, 20));
  });

  it('satır tutarı ekstraları içerir', () => {
    expect(lineTotal({ unitPrice: 25000, modifiers: [parmesan], quantity: 2 })).toBe(58000);
  });

  it('TL biçimlendirme', () => {
    expect(formatTL(25000).replace(/ /g, ' ')).toBe('250 TL');
    expect(formatTL(3545).replace(/ /g, ' ')).toBe('35,45 TL');
    expect(formatTL(25000, { fixed: true }).replace(/ /g, ' ')).toBe('250,00 TL');
  });

  it('TL girişi kuruşa çevrilir', () => {
    expect(parseTL('500')).toBe(50000);
    expect(parseTL('45,50')).toBe(4550);
    expect(parseTL('1.250,75')).toBe(125075);
    expect(parseTL('abc')).toBeNull();
  });
});
