import type { OrderDTO } from '@toscana/shared';
import { formatDateTime, formatTL } from '../../lib/format';

/** Yazdırma sırasında yalnızca fiş görünsün diye body'ye geçici sınıf eklenir. */
export function printReceipt(): void {
  document.body.classList.add('printing-receipt');
  const cleanup = () => {
    document.body.classList.remove('printing-receipt');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  window.setTimeout(cleanup, 1000);
}

/** 80 mm termal yazıcı için bilgi fişi. Mali değeri yoktur. */
export function Receipt({ order }: { order: OrderDTO }) {
  const active = order.items.filter((item) => item.status === 'ACTIVE');

  return (
    <div className="receipt" aria-hidden="true">
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14 }}>TOSCANA RISTORANTE</div>
      <div style={{ textAlign: 'center' }}>İtalya&apos;nın Sofrasında</div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div>Masa: {order.tableName}</div>
      <div>Tarih: {formatDateTime(new Date())}</div>
      <div>Adisyon no: {order.id}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      {active.map((item) => (
        <div key={item.id} style={{ marginBottom: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>
              {item.quantity} x {item.productName}
            </span>
            <span>{formatTL(item.lineTotal, { fixed: true })}</span>
          </div>
          {item.modifiers.map((modifier, index) => (
            <div key={index} style={{ paddingLeft: 10 }}>
              + {modifier.name}
            </div>
          ))}
        </div>
      ))}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Ara toplam (KDV hariç)</span>
        <span>{formatTL(order.totals.net, { fixed: true })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>KDV</span>
        <span>{formatTL(order.totals.vat, { fixed: true })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
        <span>GENEL TOPLAM</span>
        <span>{formatTL(order.totals.gross, { fixed: true })}</span>
      </div>
      {order.totals.paid > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ödenen</span>
            <span>{formatTL(order.totals.paid, { fixed: true })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Kalan</span>
            <span>{formatTL(order.totals.remaining, { fixed: true })}</span>
          </div>
        </>
      ) : null}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ textAlign: 'center', fontWeight: 700 }}>BİLGİ FİŞİDİR</div>
      <div style={{ textAlign: 'center' }}>Mali değeri yoktur. Fiyatlarımıza KDV dahildir.</div>
    </div>
  );
}
