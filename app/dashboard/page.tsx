'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  kpis: {
    totalSessions: number;
    totalUsers: number;
    pageViews: number;
    conversions: number;
    conversionRate: number;
  };
  topCampaigns: any[];
  realTimeData: {
    activeUsers: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/overview');
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Google Analytics Dashboard
        </h1>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sessions</h3>
            <p className="text-3xl font-bold text-blue-600">{data.kpis.totalSessions.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-green-600">{data.kpis.totalUsers.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Views</h3>
            <p className="text-3xl font-bold text-purple-600">{data.kpis.pageViews.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversions</h3>
            <p className="text-3xl font-bold text-orange-600">{data.kpis.conversions.toLocaleString()}</p>
          </div>
        </div>

        {/* Real-time Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Data</h2>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-lg">Active Users: <strong>{data.realTimeData.activeUsers}</strong></span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Rate</h2>
          <div className="text-2xl font-bold text-indigo-600">
            {(data.kpis.conversionRate * 100).toFixed(2)}%
          </div>
        </div>

        {/* UTM Campaigns */}
        {data.topCampaigns && data.topCampaigns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent UTM Campaigns</h2>
            <div className="space-y-4">
              {data.topCampaigns.map((campaign, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-sm text-gray-600">
                    Source: {campaign.source} | Medium: {campaign.medium}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}