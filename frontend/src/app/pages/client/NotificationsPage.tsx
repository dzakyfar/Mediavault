import DashboardLayout from '../../components/DashboardLayout';
import NotificationCenter from '../../components/dashboard/NotificationCenter';

export default function ClientNotifications() {
  return (
    <DashboardLayout userType="client">
      <NotificationCenter userType="client" />
    </DashboardLayout>
  );
}
