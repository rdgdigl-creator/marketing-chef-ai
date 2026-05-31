import type { ContentPlanDay } from "@/types/features";

export function exportContentPlanPdf(options: {
  restaurantName: string;
  durationDays: number;
  plan: ContentPlanDay[];
}) {
  const { restaurantName, durationDays, plan } = options;

  const rows = plan
    .map(
      (day) => `
    <tr>
      <td style="padding:12px;border:1px solid #ddd;font-weight:bold;">День ${day.day}</td>
      <td style="padding:12px;border:1px solid #ddd;">
        <strong>Instagram — ${day.instagram.title}</strong><br/>
        <em>${day.instagram.format}</em><br/>
        ${day.instagram.content}
      </td>
      <td style="padding:12px;border:1px solid #ddd;">
        <strong>TikTok — ${day.tiktok.title}</strong><br/>
        <em>${day.tiktok.format}</em><br/>
        ${day.tiktok.content}
      </td>
      <td style="padding:12px;border:1px solid #ddd;">
        <strong>Telegram — ${day.telegram.title}</strong><br/>
        <em>${day.telegram.format}</em><br/>
        ${day.telegram.content}
      </td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>Контент-план — ${restaurantName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
    h1 { color: #8B5CF6; margin-bottom: 8px; }
    .meta { color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #8B5CF6; color: white; padding: 12px; text-align: left; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Контент-план: ${restaurantName}</h1>
  <p class="meta">Период: ${durationDays} дней · Marketing Chef AI</p>
  <table>
    <thead>
      <tr>
        <th>День</th>
        <th>Instagram</th>
        <th>TikTok</th>
        <th>Telegram</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}
