'use server'

import Mailgun from 'mailgun.js'
import FormData from 'form-data'

const mailgun = new Mailgun(FormData)

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function submitContactForm(data: ContactFormData) {
  const { name, email, subject, message } = data

  if (!name || !email || !subject || !message) {
    return { success: false, error: 'All fields are required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please provide a valid email address.' }
  }

  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN

  if (!apiKey || !domain) {
    console.error('Mailgun credentials not configured')
    return { success: false, error: 'Email service is not configured. Please try again later.' }
  }

  try {
    const mg = mailgun.client({ username: 'api', key: apiKey })

    await mg.messages.create(domain, {
      from: `Contact Form <noreply@${domain}>`,
      to: ['info@innozverse.com'],
      subject: `New Inquiry: ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        '',
        'Message:',
        message,
      ].join('\n'),
      'h:Reply-To': email,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send contact email:', error)
    return { success: false, error: 'Failed to send message. Please try again later.' }
  }
}
