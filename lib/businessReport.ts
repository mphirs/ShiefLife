// Business mode: printable stock / expiry report (PDF via the phone's print/share sheet).
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ShelfProduct, daysUntilExpiry } from './products';
import { Settings, formatMoney } from './settings';

export const valueOf = (p: ShelfProduct) => (p.unitCost != null ? p.unitCost * p.quantity : p.price ?? 0);

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export function buildReportHtml(products: ShelfProduct[], settings: Settings) {
  const rows = [...products]
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .map(p => {
      const d = daysUntilExpiry(p.expiryDate);
      const status = d < 0 ? 'EXPIRED' : d <= 7 ? 'Expiring soon' : 'OK';
      const color = d < 0 ? '#DC2626' : d <= 7 ? '#CA8A04' : '#16A34A';
      return `<tr>
        <td>${esc(p.name)}</td><td>${esc(p.batchNo ?? '-')}</td><td>${esc(p.supplier ?? '-')}</td>
        <td style="text-align:right">${p.quantity}</td><td>${p.expiryDate}</td>
        <td style="color:${color};font-weight:700">${status} (${d}d)</td>
        <td style="text-align:right">${formatMoney(valueOf(p), settings.currency)}</td></tr>`;
    })
    .join('');

  const expired = products.filter(p => daysUntilExpiry(p.expiryDate) < 0);
  const soon = products.filter(p => {
    const d = daysUntilExpiry(p.expiryDate);
    return d >= 0 && d <= 7;
  });
  const sum = (list: ShelfProduct[]) => list.reduce((s, p) => s + valueOf(p), 0);

  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#1E3024}
    h1{color:#237A4B;margin:0} .sub{color:#667;margin-bottom:18px}
    .cards{display:flex;gap:12px;margin-bottom:18px}
    .card{flex:1;border:1px solid #dde;border-radius:10px;padding:10px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#237A4B;color:#fff;text-align:left;padding:6px}
    td{padding:6px;border-bottom:1px solid #e5e9e3}
  </style></head><body>
    <h1>ShelfLife stock &amp; expiry report</h1>
    <div class="sub">Generated ${new Date().toLocaleString()}</div>
    <div class="cards">
      <div class="card"><b>${products.length}</b><br/>batches in stock</div>
      <div class="card"><b>${expired.length}</b><br/>expired (${formatMoney(sum(expired), settings.currency)})</div>
      <div class="card"><b>${soon.length}</b><br/>expiring within 7 days (${formatMoney(sum(soon), settings.currency)})</div>
    </div>
    <table><tr><th>Product</th><th>Batch</th><th>Supplier</th><th>Qty</th><th>Expiry</th><th>Status</th><th>Value</th></tr>${rows}</table>
  </body></html>`;
}

export async function shareBusinessReport(products: ShelfProduct[], settings: Settings) {
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(products, settings) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'ShelfLife report' });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function printBusinessReport(products: ShelfProduct[], settings: Settings) {
  await Print.printAsync({ html: buildReportHtml(products, settings) });
}
