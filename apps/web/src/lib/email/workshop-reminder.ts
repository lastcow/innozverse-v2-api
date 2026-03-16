export interface WorkshopReminderData {
  userName: string
  workshopTitle: string
  workshopDescription: string
  startDate: string
  startTime: string
  endTime: string
  registrationCount: number
  capacity: number
  seats: number
  products: Array<{ name: string; quantity: number }>
  workshopUrl: string
}

export function buildWorkshopReminderEmail(data: WorkshopReminderData): string {
  const truncatedDescription =
    data.workshopDescription.length > 200
      ? data.workshopDescription.slice(0, 200) + '...'
      : data.workshopDescription

  const capacityText =
    data.capacity > 0
      ? `${data.registrationCount}/${data.capacity} seats filled`
      : `${data.registrationCount} registered`

  const productsHtml =
    data.products.length > 0
      ? `
      <div style="margin-bottom:24px;">
        <h3 style="color:#202224;font-size:16px;font-weight:600;margin:0 0 12px;">
          Items to Prepare
        </h3>
        <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px;">
          ${data.products
            .map(
              (p) => `
          <div style="padding:6px 0;">
            <span style="color:#D97706;margin-right:8px;">&#9679;</span>
            <span style="color:#92400E;font-size:14px;">${escapeHtml(p.name)} (x${p.quantity})</span>
          </div>`
            )
            .join('')}
        </div>
      </div>`
      : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#202224;font-size:24px;font-weight:700;margin:0;">innoZverse</h1>
      </div>

      <div style="margin-bottom:20px;">
        <span style="background-color:#EEF2FF;border-radius:8px;padding:8px 16px;color:#4379EE;font-size:13px;font-weight:600;display:inline-block;">Workshop Tomorrow</span>
      </div>

      <h2 style="color:#202224;font-size:20px;font-weight:600;margin:0 0 16px;">
        ${escapeHtml(data.workshopTitle)}
      </h2>

      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
        ${escapeHtml(truncatedDescription)}
      </p>

      <div style="background-color:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:13px;font-weight:500;width:100px;">Date</td>
            <td style="padding:8px 0;color:#202224;font-size:14px;">${escapeHtml(data.startDate)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:13px;font-weight:500;">Time</td>
            <td style="padding:8px 0;color:#202224;font-size:14px;">${escapeHtml(data.startTime)} - ${escapeHtml(data.endTime)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:13px;font-weight:500;">Capacity</td>
            <td style="padding:8px 0;color:#202224;font-size:14px;">${capacityText}</td>
          </tr>
        </table>
      </div>

      ${productsHtml}

      <div style="text-align:center;margin:32px 0;">
        <a href="${escapeHtml(data.workshopUrl)}"
           style="display:inline-block;background-color:#4379EE;color:white;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          View Workshop Details
        </a>
      </div>

      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 16px;">
        &#9200; Please plan to arrive <strong>15 minutes early</strong> for setup and preparation.
      </p>

      <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:24px 0 0;">
        You&rsquo;re receiving this email because you registered ${data.seats} seat${data.seats > 1 ? 's' : ''} for this workshop.
        If you can no longer attend, please cancel your registration on our website.
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
        &copy; innoZverse. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
