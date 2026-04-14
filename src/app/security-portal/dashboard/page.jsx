'use client' 
 
import StatsCards from '@/components/user/layouts/stats-cards'; 
import ServiceCards from '@/components/user/layouts/service-cards';
import DeliveryCards from '@/components/user/layouts/active-deliveries';
 
export default function DashboardPage() { 
  return ( 
    <> 
      <StatsCards />
      <ServiceCards />
      <DeliveryCards /> 
    </> 
  ); 
}