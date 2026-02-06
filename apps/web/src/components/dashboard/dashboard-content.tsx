'use client'

import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Star,
  ChevronRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// --- Mock Data ---

const enrollmentData = [
  { month: 'Jan', paid: 32, free: 12 },
  { month: 'Feb', paid: 45, free: 18 },
  { month: 'Mar', paid: 52, free: 15 },
  { month: 'Apr', paid: 48, free: 22 },
  { month: 'May', paid: 55, free: 20 },
  { month: 'Jun', paid: 42, free: 25 },
  { month: 'Jul', paid: 60, free: 18 },
  { month: 'Aug', paid: 58, free: 22 },
  { month: 'Sep', paid: 50, free: 16 },
]

const trafficData = [
  { name: 'Organic Search', value: 875, color: '#f59e0b' },
  { name: 'Referrals', value: 450, color: '#22c55e' },
  { name: 'Social Media', value: 4305, color: '#4379EE' },
]

const topInstructors = [
  { name: 'Dianne Russell', id: 'Agent ID: 36254', reviews: 25, rating: 5 },
  { name: 'Wade Warren', id: 'Agent ID: 36254', reviews: 25, rating: 4 },
  { name: 'Albert Flores', id: 'Agent ID: 36254', reviews: 25, rating: 4 },
  { name: 'Bessie Cooper', id: 'Agent ID: 36254', reviews: 25, rating: 5 },
  { name: 'Arlene McCoy', id: 'Agent ID: 36254', reviews: 25, rating: 4 },
]

const studentProgress = [
  { name: 'Theresa Webb', course: 'UI/UX Design Course', progress: 33 },
  { name: 'Robert Fox', course: 'Graphic Design Course', progress: 70 },
  { name: 'Guy Hawkins', course: 'Web Developer Course', progress: 80 },
  { name: 'Cody Fisher', course: 'UI/UX Design Course', progress: 20 },
  { name: 'Robiul Hasan', course: 'UI/UX Design Course', progress: 40 },
]

// --- Stat Card ---

function StatCard({
  label,
  value,
  badge,
  bgColor,
  iconBg,
  icon: Icon,
}: {
  label: string
  value: string
  badge: string
  bgColor: string
  iconBg: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`${iconBg} w-10 h-10 rounded-full flex items-center justify-center mb-3`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-[28px] font-bold text-gray-800 leading-tight mt-1">{value}</p>
        </div>
        <span className="text-[11px] font-semibold text-green-700 bg-white/60 px-2 py-1 rounded-full whitespace-nowrap mt-1">
          {badge}
        </span>
      </div>
    </div>
  )
}

// --- Progress Ring ---

function ProgressRing({ progress, size = 42 }: { progress: number; size?: number }) {
  const strokeWidth = 3.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const color =
    progress >= 70 ? '#4379EE' : progress >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700">
        {progress}
      </span>
    </div>
  )
}

// --- Star Rating ---

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

// --- Main Component ---

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Row 1: Stat Cards + Line Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stat Cards Column */}
        <div className="lg:col-span-3 space-y-4">
          <StatCard
            label="Total Students"
            value="15,000"
            badge="+2.5%"
            bgColor="bg-[#FFE2E5]"
            iconBg="bg-[#FA5A7D]"
            icon={Users}
          />
          <StatCard
            label="Total Courses"
            value="420"
            badge="+30"
            bgColor="bg-[#FFF4DE]"
            iconBg="bg-[#FF947A]"
            icon={BookOpen}
          />
          <StatCard
            label="Overall Revenue"
            value="$50,000"
            badge="+1.5%"
            bgColor="bg-[#DCFCE7]"
            iconBg="bg-[#3CD856]"
            icon={DollarSign}
          />
        </div>

        {/* Line Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-[#202224]">Average Enrollment Rate</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4379EE]" />
                Paid Course: 350
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22d3ee]" />
                Free Course: 70
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(v) => `$${v}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
                  fontSize: 12,
                  padding: '8px 12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="paid"
                stroke="#4379EE"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#4379EE', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="free"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6">
          <h3 className="text-lg font-bold text-[#202224] mb-1">Traffic Sources</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2.5">
            {trafficData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Top Instructors + Student Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Instructors */}
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-[#202224]">Top Instructors</h3>
            <button className="text-sm font-medium text-[#4379EE] hover:text-blue-700 flex items-center gap-0.5 transition-colors">
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {topInstructors.map((instructor) => (
              <div
                key={instructor.name}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {instructor.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{instructor.name}</p>
                    <p className="text-xs text-gray-400">{instructor.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StarRating rating={instructor.rating} />
                  <p className="text-xs text-gray-400 mt-0.5">{instructor.reviews} Reviews</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Progress */}
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-[#202224]">Student&apos;s Progress</h3>
            <button className="text-sm font-medium text-[#4379EE] hover:text-blue-700 flex items-center gap-0.5 transition-colors">
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {studentProgress.map((student) => (
              <div
                key={student.name}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {student.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.course}</p>
                  </div>
                </div>
                <ProgressRing progress={student.progress} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
