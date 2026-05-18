import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';

export default function FreelancerPortfolio() {
  return (
    <DashboardLayout userType="freelancer">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Portfolio
      </h1>
      <EmptyState
        title="Portfolio masih kosong"
        description="Item portfolio dari database dan file S3 private akan tampil di sini setelah endpoint upload dibuat."
      />
    </DashboardLayout>
  );
}
