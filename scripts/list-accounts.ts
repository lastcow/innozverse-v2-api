import { prisma } from '@repo/database'

async function listAccounts() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        oauthProvider: true,
        emailVerified: true,
        createdAt: true,
        studentVerification: {
          select: {
            status: true,
            verificationMethod: true,
            eduEmail: true,
            verifiedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`\n📊 Total Accounts: ${users.length}\n`)
    console.log('═'.repeat(120))

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Account`)
      console.log('─'.repeat(120))
      console.log(`   ID:              ${user.id}`)
      console.log(`   Email:           ${user.email}`)
      console.log(`   Role:            ${user.role}`)
      console.log(`   OAuth Provider:  ${user.oauthProvider || 'LOCAL'}`)
      console.log(`   Email Verified:  ${user.emailVerified ? '✅ Yes' : '❌ No'}`)
      console.log(`   Created:         ${user.createdAt.toLocaleString()}`)

      if (user.studentVerification) {
        const sv = user.studentVerification
        console.log(`\n   📚 Student Verification:`)
        console.log(`      Status:           ${sv.status}`)
        console.log(`      Method:           ${sv.verificationMethod}`)
        console.log(`      Edu Email:        ${sv.eduEmail || 'N/A'}`)
        console.log(`      Verified At:      ${sv.verifiedAt ? sv.verifiedAt.toLocaleString() : 'Not verified'}`)
      } else {
        console.log(`\n   📚 Student Verification: Not initiated`)
      }
    })

    console.log('\n' + '═'.repeat(120))

    // Summary
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const verifiedCount = users.filter(u => u.emailVerified).length
    const studentVerifiedCount = users.filter(
      u => u.studentVerification?.status === 'APPROVED'
    ).length

    console.log(`\n📈 Summary:`)
    console.log(`   Total Users:           ${users.length}`)
    console.log(`   Email Verified:        ${verifiedCount}`)
    console.log(`   Student Verified:      ${studentVerifiedCount}`)
    console.log(`\n   By Role:`)
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`      ${role}: ${count}`)
    })
    console.log('')

  } catch (error) {
    console.error('❌ Error fetching accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAccounts()
