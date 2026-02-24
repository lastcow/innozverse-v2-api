'use server'

import { auth } from '@/auth'
import { prisma } from '@repo/database'
import { createVerificationToken } from '@/lib/verification-token'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'

export async function getStudentVerificationStatus() {
  const session = await auth()
  if (!session?.user?.id) {
    return { status: 'NOT_SUBMITTED' as const, verification: null }
  }

  const verification = await prisma.studentVerification.findUnique({
    where: { userId: session.user.id },
  })

  if (!verification) {
    return { status: 'NOT_SUBMITTED' as const, verification: null }
  }

  return {
    status: verification.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    verification: {
      id: verification.id,
      status: verification.status,
      eduEmail: verification.eduEmail,
      verifiedAt: verification.verifiedAt?.toISOString() ?? null,
      createdAt: verification.createdAt.toISOString(),
      adminNotes: verification.adminNotes,
    },
  }
}

export async function requestStudentVerification(eduEmail: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' }
  }

  const normalizedEmail = eduEmail.trim().toLowerCase()

  // Backend validation — format check + .edu suffix
  if (!/^[^\s@]+@[^\s@]+\.edu$/i.test(normalizedEmail)) {
    return { error: 'Please enter a valid .edu email address.' }
  }

  // Uniqueness check — no other user should have this .edu email pending or approved
  const existingOther = await prisma.studentVerification.findFirst({
    where: {
      eduEmail: normalizedEmail,
      userId: { not: session.user.id },
      status: { in: ['PENDING', 'APPROVED'] },
    },
  })

  if (existingOther) {
    return { error: 'This student email is already in use by another account.' }
  }

  // Check user's existing record
  let verification = await prisma.studentVerification.findUnique({
    where: { userId: session.user.id },
  })

  if (verification?.status === 'APPROVED') {
    return { error: 'You are already verified as a student.' }
  }

  // Create or update the verification record
  if (verification) {
    verification = await prisma.studentVerification.update({
      where: { userId: session.user.id },
      data: {
        status: 'PENDING',
        verificationMethod: 'EDU_EMAIL',
        eduEmail: normalizedEmail,
        adminNotes: null,
        verifiedAt: null,
        verifiedById: null,
      },
    })
  } else {
    verification = await prisma.studentVerification.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        verificationMethod: 'EDU_EMAIL',
        eduEmail: normalizedEmail,
      },
    })
  }

  // Generate HMAC-signed token (encodes verification ID + email + 24h expiry)
  const token = createVerificationToken(verification.id, normalizedEmail)

  // Send verification email via Mailgun
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'

  if (!apiKey || !domain) {
    return { error: 'Email service is not configured. Please try again later.' }
  }

  try {
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: apiKey })

    const verifyUrl = `${webUrl}/verify-student?token=${encodeURIComponent(token)}`

    await mg.messages.create(domain, {
      from: `innoZverse <noreply@${domain}>`,
      to: [normalizedEmail],
      subject: 'Verify your Student Status at innoZverse',
      html: buildVerificationEmail(verifyUrl),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { error: 'Failed to send verification email. Please try again later.' }
  }
}

function buildVerificationEmail(verifyUrl: string): string {
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
      <h2 style="color:#202224;font-size:20px;font-weight:600;margin:0 0 16px;">
        Verify Your Student Status
      </h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Click the button below to verify your student email address and unlock
        student discounts and benefits.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}"
           style="display:inline-block;background-color:#4379EE;color:white;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Verify Student Status
        </a>
      </div>
      <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:24px 0 0;">
        This link will expire in 24 hours. If you didn&rsquo;t request this
        verification, you can safely ignore this email.
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
