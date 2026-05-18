import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';

export default function ClientPayments() {
  return (
    <DashboardLayout userType="client">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Payments
      </h1>
      <EmptyState
        title="Belum ada invoice"
        description="Invoice dari database akan tampil di sini setelah project menghasilkan tagihan."
      />
    </DashboardLayout>
  );
}
