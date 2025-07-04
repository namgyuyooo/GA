'use client'

import AuthenticatedLayout from '../components/AuthenticatedLayout'
import Settings from '../components/Settings'

export default function SettingsPage() {
    return (
        <AuthenticatedLayout activeTab="settings">
            <Settings />
        </AuthenticatedLayout>
    )
} 