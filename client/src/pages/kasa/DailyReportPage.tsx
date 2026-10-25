import { useState } from 'react';
import { useGetDailyReportQuery } from '../../api/api';
import { ErrorState, Loading } from '../../components/StateMessage';
import { Button } from '../../components/ui/Button';
import { errorMessage } from '../../lib/errors';
import { formatLongDate, formatTime, formatTL, todayISO } from '../../lib/format';

/** Gün sonu: nakit / kart toplamı, satılan ürünler ve iptaller. */
export function DailyReportPage() {
  const [date, setDate] = useState(todayISO);
  const { data: report, isFetching, isError, error, refetch } = useGetDailyReportQuery(date, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <div className="h-full overflow-y-auto print:h-auto print:overflow-visible">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold">Gün sonu</h1>
            <p className="text-ink-soft">{formatLongDate(date)}</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="h-11 rounded-lg border border-line bg-white px-3"
              aria-label="Rapor tarihi"
            />
            <Button variant="outline" onClick={() => void refetch()} loading={isFetching}>
              Yenile
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              Yazdır
            </Button>
          </div>
        </div>

        {isFetching && !report ? <Loading /> : null}
        {isError ? <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

        {report ? (
          <>
            <section className="grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:grid-cols-3">
              <div>
                <p className="text-ink-soft">Nakit</p>
                <p className="text-2xl font-semibold tabular-nums">{formatTL(report.cash, { fixed: true })}</p>
              </div>
              <div>
                <p className="text-ink-soft">Kart</p>
                <p className="text-2xl font-semibold tabular-nums">{formatTL(report.card, { fixed: true })}</p>
              </div>
              <div>
                <p className="text-ink-soft">Toplam tahsilat</p>
                <p className="font-display text-4xl font-semibold tabular-nums">{formatTL(report.total, { fixed: true })}</p>
              </div>
              <p className="text-sm text-ink-soft sm:col-span-3">
                {report.paymentCount} ödeme, {report.closedOrderCount} kapanan adisyon.{' '}
                {report.openOrderCount > 0
                  ? `Şu an ${report.openOrderCount} masa açık, tahsil edilmemiş ${formatTL(report.openRemaining, { fixed: true })}.`
                  : 'Açık masa yok.'}
              </p>
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <h2 className="mb-3 text-lg font-semibold">Satılan ürünler</h2>
              {report.products.length === 0 ? (
                <p className="text-ink-soft">Bu gün için ödeme alınmamış.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-sm text-ink-soft">
                    <tr className="border-b border-line">
                      <th className="py-2 font-medium">Ürün</th>
                      <th className="py-2 text-right font-medium">Adet</th>
                      <th className="py-2 text-right font-medium">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.products.map((product) => (
                      <tr key={product.name} className="border-b border-line/60">
                        <td className="py-2">{product.name}</td>
                        <td className="py-2 text-right tabular-nums">{product.quantity}</td>
                        <td className="py-2 text-right tabular-nums">{formatTL(product.amount, { fixed: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <h2 className="mb-3 text-lg font-semibold">İptaller</h2>
              {report.voids.length === 0 ? (
                <p className="text-ink-soft">İptal yok.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-sm text-ink-soft">
                    <tr className="border-b border-line">
                      <th className="py-2 font-medium">Saat</th>
                      <th className="py-2 font-medium">Ürün</th>
                      <th className="py-2 font-medium">Sebep</th>
                      <th className="py-2 font-medium">Personel</th>
                      <th className="py-2 text-right font-medium">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.voids.map((entry, index) => (
                      <tr key={index} className="border-b border-line/60">
                        <td className="py-2 tabular-nums">{formatTime(entry.at)}</td>
                        <td className="py-2">
                          {entry.quantity} × {entry.productName}
                        </td>
                        <td className="py-2">{entry.reason}</td>
                        <td className="py-2">{entry.staffName}</td>
                        <td className="py-2 text-right tabular-nums">{formatTL(entry.amount, { fixed: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
