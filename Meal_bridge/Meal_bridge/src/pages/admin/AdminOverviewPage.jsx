import { ClipboardList, Package, Store, Truck, Bike, Building2, Utensils } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'

export default function AdminOverviewPage() {
  const { stats } = useAdmin()

  return (
    <>
      <PageHeader title="Overview" description="Platform activity across donors, receivers and volunteers." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Utensils} label="Registered users" value={stats.registeredUsers} />
        <StatCard icon={Package} label="Active donations" value={stats.activeDonations} />
        <StatCard icon={Truck} label="Ongoing pickups" value={stats.ongoingPickups} />
        <StatCard icon={ClipboardList} label="Completed deliveries" value={stats.completedDeliveries} />
        <StatCard icon={Store} label="Donors" value={stats.usersByRole.donor} />
        <StatCard icon={Building2} label="Receivers" value={stats.usersByRole.receiver} />
        <StatCard icon={Bike} label="Volunteers" value={stats.usersByRole.volunteer} />
        <StatCard icon={Package} label="Expired listings" value={stats.expiredListings} />
      </div>
    </>
  )
}
