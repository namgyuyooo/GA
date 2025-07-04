'use client'

import AuthenticatedLayout from '../components/AuthenticatedLayout'
import ReportManager from '../components/ReportManager'

export default function ReportsPage() {
  return (
    <AuthenticatedLayout activeTab="reports">
      <ReportManager />
    </AuthenticatedLayout>
  )
}
