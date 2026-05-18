import { Link } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';

export default function ClientPaymentDetail() {
  return (
    <DashboardLayout userType="client">
      <Link to="/dashboard/client/payments" className="text-[#888888] hover:text-[#F5C800] transition-colors">
        Back to payments
      </Link>
      <div className="mt-8">
        <EmptyState
          title="Invoice tidak ditemukan"
          description="Detail invoice akan diambil dari database setelah endpoint payment detail tersedia."
        />
      </div>
    </DashboardLayout>
  );
}
