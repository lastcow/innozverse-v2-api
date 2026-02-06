import { Hero } from '@/components/home/hero'
import { HybridLearning } from '@/components/home/hybrid-learning'
import { StudentAdvantage } from '@/components/home/student-advantage'
import { CommunityTrust } from '@/components/home/community-trust'

export default function HomePage() {
  return (
    <>
      <Hero />
      <HybridLearning />
      <StudentAdvantage />
      <CommunityTrust />
    </>
  )
}
