'use client'

import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import CompetitorIntelligence from '../../components/CompetitorIntelligence'

export default function CompetitorIntelligencePage() {
  return (
    <AuthenticatedLayout activeTab="tools">
      <CompetitorIntelligence />
    </AuthenticatedLayout>
  )
}