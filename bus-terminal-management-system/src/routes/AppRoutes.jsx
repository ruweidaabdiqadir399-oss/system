import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_HOME_ROUTES } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute';

import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageLoader from '../components/common/PageLoader';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminBuses from '../pages/admin/Buses';
import AdminRoutes from '../pages/admin/Routes';
import AdminSchedules from '../pages/admin/Schedules';
import AdminBookings from '../pages/admin/Bookings';
import AdminTickets from '../pages/admin/Tickets';
import AdminPayments from '../pages/admin/Payments';
import AdminTracking from '../pages/admin/Tracking';
import AdminReports from '../pages/admin/Reports';
import AdminUsers from '../pages/admin/Users';
import AdminSettings from '../pages/admin/Settings';
import AdminProfile from '../pages/admin/Profile';

import StaffDashboard from '../pages/staff/Dashboard';
import StaffBookings from '../pages/staff/Bookings';
import StaffTickets from '../pages/staff/Tickets';
import StaffScanTicket from '../pages/staff/ScanTicket';
import StaffBoardingHistory from '../pages/staff/BoardingHistory';
import StaffPayments from '../pages/staff/Payments';
import StaffSchedules from '../pages/staff/Schedules';
import StaffProfile from '../pages/staff/Profile';

import DriverDashboard from '../pages/driver/Dashboard';
import DriverTripConsole from '../pages/driver/TripConsole';
import DriverSchedule from '../pages/driver/Schedule';
import DriverProfile from '../pages/driver/Profile';

import CustomerHome from '../pages/customer/Home';
import CustomerSearchResults from '../pages/customer/SearchResults';
import CustomerSeatSelection from '../pages/customer/SeatSelection';
import CustomerCheckout from '../pages/customer/Checkout';
import CustomerBookings from '../pages/customer/Bookings';
import CustomerTicketView from '../pages/customer/TicketView';
import CustomerTrackBus from '../pages/customer/TrackBus';
import CustomerProfile from '../pages/customer/Profile';

const RoleHomeRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <PageLoader label="Loading BTMS..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Navigate to={ROLE_HOME_ROUTES[role] ?? '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RoleHomeRedirect />} />

    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/buses" element={<AdminBuses />} />
        <Route path="/admin/routes" element={<AdminRoutes />} />
        <Route path="/admin/schedules" element={<AdminSchedules />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/tickets" element={<AdminTickets />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/tracking" element={<AdminTracking />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/bookings" element={<StaffBookings />} />
        <Route path="/staff/tickets" element={<StaffTickets />} />
        <Route path="/staff/scan-ticket" element={<StaffScanTicket />} />
        <Route path="/staff/boarding-history" element={<StaffBoardingHistory />} />
        <Route path="/staff/payments" element={<StaffPayments />} />
        <Route path="/staff/schedules" element={<StaffSchedules />} />
        <Route path="/staff/profile" element={<StaffProfile />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={[ROLES.DRIVER]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/trip" element={<DriverTripConsole />} />
        <Route path="/driver/schedule" element={<DriverSchedule />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/customer/home" element={<CustomerHome />} />
        <Route path="/customer/search" element={<CustomerSearchResults />} />
        <Route path="/customer/book/:scheduleId/seats" element={<CustomerSeatSelection />} />
        <Route path="/customer/book/:scheduleId/checkout" element={<CustomerCheckout />} />
        <Route path="/customer/bookings" element={<CustomerBookings />} />
        <Route path="/customer/tickets" element={<CustomerTicketView />} />
        <Route path="/customer/track" element={<CustomerTrackBus />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
      </Route>
    </Route>

    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
