import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';

export default function FreelancerEarnings() {
  return (
    <DashboardLayout userType="freelancer">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Earnings
      </h1>
      <EmptyState
        title="Belum ada earning"
        description="Data earning akan ditampilkan dari invoice dan pembayaran di database."
      />
    </DashboardLayout>
  );
}
