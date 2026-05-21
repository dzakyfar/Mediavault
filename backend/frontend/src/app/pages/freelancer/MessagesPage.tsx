import DashboardLayout from '../../components/DashboardLayout';
import MessageCenter from '../../components/dashboard/MessageCenter';

export default function FreelancerMessages() {
  return (
    <DashboardLayout userType="freelancer">
      <MessageCenter userType="freelancer" />
    </DashboardLayout>
  );
}
