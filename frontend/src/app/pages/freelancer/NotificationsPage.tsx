import DashboardLayout from '../../components/DashboardLayout';
import NotificationCenter from '../../components/dashboard/NotificationCenter';

export default function FreelancerNotifications() {
  return (
    <DashboardLayout userType="freelancer">
      <NotificationCenter userType="freelancer" />
    </DashboardLayout>
  );
}
