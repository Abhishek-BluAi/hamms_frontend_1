'use client'
import StatsCards from '@/components/admin/layouts/stats-cards';
import TrafficCharts from '@/components/admin/layouts/traffic-charts';
import RecentActivity from '@/components/admin/layouts/recent-activity';

export default function DashboardPage() {
  return (
    <>
      <StatsCards />
      <TrafficCharts />
      <RecentActivity />
    </>
  );
}
