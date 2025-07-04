'use client'

import AuthenticatedLayout from '../components/AuthenticatedLayout'

export default function ReportsPage() {
  return (
    <AuthenticatedLayout activeTab="reports">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">리포트 관리</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>리포트 기능은 현재 개발 중입니다.</p>
            </div>
            <div className="mt-5">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="text-sm">
                  <p className="text-blue-700">
                    새로운 통합 분석 시스템으로 업데이트되면서 더 나은 리포트 기능을 제공할 예정입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
