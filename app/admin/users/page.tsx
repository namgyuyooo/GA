'use client'

import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import UserManagement from '../../components/UserManagement'

export default function AdminUsersPage() {
  return (
    <AuthenticatedLayout activeTab="admin-users">
      <UserManagement />
    </AuthenticatedLayout>
  )
}