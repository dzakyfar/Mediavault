import DashboardLayout from '../../components/DashboardLayout';
import MessageCenter from '../../components/dashboard/MessageCenter';

export default function ClientMessages() {
  return (
    <DashboardLayout userType="client">
      <MessageCenter userType="client" />
    </DashboardLayout>
  );
}
