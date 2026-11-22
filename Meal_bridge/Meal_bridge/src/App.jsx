import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DemoProvider } from './context/DemoContext.jsx'
import SiteLayout from './components/layout/SiteLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import RoleSelectionPage from './pages/RoleSelectionPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import { DonorProvider } from './context/DonorContext.jsx'
import DashboardLayout from './components/dashboard/DashboardLayout.jsx'
import DonorOverviewPage from './pages/dashboard/DonorOverviewPage.jsx'
import AddFoodPage from './pages/dashboard/AddFoodPage.jsx'
import MyDonationsPage from './pages/dashboard/MyDonationsPage.jsx'
import DonationHistoryPage from './pages/dashboard/DonationHistoryPage.jsx'
import NotificationsPage from './pages/dashboard/NotificationsPage.jsx'
import DonorProfilePage from './pages/dashboard/DonorProfilePage.jsx'
import { ReceiverProvider } from './context/ReceiverContext.jsx'
import ReceiverLayout from './components/dashboard/ReceiverLayout.jsx'
import ReceiverOverviewPage from './pages/receiver/ReceiverOverviewPage.jsx'
import AvailableFoodPage from './pages/receiver/AvailableFoodPage.jsx'
import MyClaimsPage from './pages/receiver/MyClaimsPage.jsx'
import DeliveryHistoryPage from './pages/receiver/DeliveryHistoryPage.jsx'
import ReceiverNotificationsPage from './pages/receiver/ReceiverNotificationsPage.jsx'
import OrganizationProfilePage from './pages/receiver/OrganizationProfilePage.jsx'
import ImpactDashboardPage from './pages/impact/ImpactDashboardPage.jsx'
import { VolunteerProvider } from './context/VolunteerContext.jsx'
import VolunteerLayout from './components/dashboard/VolunteerLayout.jsx'
import VolunteerOverviewPage from './pages/volunteer/VolunteerOverviewPage.jsx'
import VolunteerPickupsPage from './pages/volunteer/VolunteerPickupsPage.jsx'
import VolunteerTasksPage from './pages/volunteer/VolunteerTasksPage.jsx'
import VolunteerCompletedPage from './pages/volunteer/VolunteerCompletedPage.jsx'
import VolunteerNotificationsPage from './pages/volunteer/VolunteerNotificationsPage.jsx'
import VolunteerProfilePage from './pages/volunteer/VolunteerProfilePage.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminOverviewPage from './pages/admin/AdminOverviewPage.jsx'
import AdminDonorsPage from './pages/admin/AdminDonorsPage.jsx'
import AdminReceiversPage from './pages/admin/AdminReceiversPage.jsx'
import AdminVolunteersPage from './pages/admin/AdminVolunteersPage.jsx'
import AdminListingsPage from './pages/admin/AdminListingsPage.jsx'
import AdminPickupsPage from './pages/admin/AdminPickupsPage.jsx'
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx'
import SponsorPage from './pages/sponsor/SponsorPage.jsx'

export default function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="register" element={<RoleSelectionPage />} />
            <Route path="register/:role" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="impact" element={<ImpactDashboardPage />} />
            <Route path="sponsor" element={<SponsorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          <Route
            path="/dashboard/donor"
            element={
              <DonorProvider>
                <DashboardLayout />
              </DonorProvider>
            }
          >
            <Route index element={<DonorOverviewPage />} />
            <Route path="add" element={<AddFoodPage />} />
            <Route path="donations" element={<MyDonationsPage />} />
            <Route path="history" element={<DonationHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<DonorProfilePage />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Route>
          <Route
            path="/dashboard/receiver"
            element={
              <ReceiverProvider>
                <ReceiverLayout />
              </ReceiverProvider>
            }
          >
            <Route index element={<ReceiverOverviewPage />} />
            <Route path="available" element={<AvailableFoodPage />} />
            <Route path="claims" element={<MyClaimsPage />} />
            <Route path="history" element={<DeliveryHistoryPage />} />
            <Route path="notifications" element={<ReceiverNotificationsPage />} />
            <Route path="profile" element={<OrganizationProfilePage />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Route>
          <Route
            path="/dashboard/volunteer"
            element={
              <VolunteerProvider>
                <VolunteerLayout />
              </VolunteerProvider>
            }
          >
            <Route index element={<VolunteerOverviewPage />} />
            <Route path="pickups" element={<VolunteerPickupsPage />} />
            <Route path="tasks" element={<VolunteerTasksPage />} />
            <Route path="completed" element={<VolunteerCompletedPage />} />
            <Route path="notifications" element={<VolunteerNotificationsPage />} />
            <Route path="profile" element={<VolunteerProfilePage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminProvider>
                <AdminLayout />
              </AdminProvider>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="donors" element={<AdminDonorsPage />} />
            <Route path="receivers" element={<AdminReceiversPage />} />
            <Route path="volunteers" element={<AdminVolunteersPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="pickups" element={<AdminPickupsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  )
}
