import Mailgun from 'mailgun.js'
import FormData from 'form-data'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail(
  params: SendEmailParams
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN

  if (!apiKey || !domain) {
    return { success: false, error: 'Email service is not configured.' }
  }

  try {
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: apiKey })

    await mg.messages.create(domain, {
      from: `innoZverse <noreply@${domain}>`,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
