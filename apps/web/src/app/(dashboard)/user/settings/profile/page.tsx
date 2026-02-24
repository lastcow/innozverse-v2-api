import { StudentVerification } from '@/components/user/StudentVerification'

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#202224] mb-2">My Profile</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage your personal information and student verification.
      </p>

      <StudentVerification />
    </div>
  )
}
