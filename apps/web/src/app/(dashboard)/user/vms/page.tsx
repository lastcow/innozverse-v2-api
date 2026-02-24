import { getUserVMs } from '@/app/actions/user-vms'
import { VMCardGrid } from './vm-card-grid'

export default async function UserVMsPage() {
  const vms = await getUserVMs()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#202224]">My Virtual Machines</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and control your assigned virtual machines
        </p>
      </div>
      <VMCardGrid initialVMs={vms} />
    </div>
  )
}
