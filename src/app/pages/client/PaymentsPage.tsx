import { Link } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';

export default function ClientPayments() {
  const summary = [
    { label: 'Total Spent', value: 'Rp 4.500.000', color: 'text-[#F5C800]' },
    { label: 'Pending', value: 'Rp 1.500.000', color: 'text-[#F97316]' },
    { label: 'Last Payment', value: 'Rp 500.000', subtext: '5 Mar 2026', color: 'text-white' },
  ];

  const payments = [
    { id: '1', project: 'Brand Product Shoot', freelancer: 'Fauzan A.', invoice: '#INV-2026-001', date: '1 Mar 2026', amount: 'Rp 1.575.000', status: 'Pending', statusColor: 'bg-[#F97316]' },
    { id: '2', project: 'Wedding Documentation', freelancer: 'Nathanael V.', invoice: '#INV-2026-002', date: '5 Mar 2026', amount: 'Rp 2.625.000', status: 'Paid', statusColor: 'bg-[#22C55E]' },
    { id: '3', project: 'Corporate Headshots', freelancer: 'Dzaky F.', invoice: '#INV-2026-003', date: '28 Feb 2026', amount: 'Rp 840.000', status: 'Paid', statusColor: 'bg-[#22C55E]' },
  ];

  return (
    <DashboardLayout userType="client" userName="Rania K.">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Payments & Invoices
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {summary.map((item, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className={`text-3xl font-bold mb-2 ${item.color}`}>{item.value}</div>
            <div className="text-[#888888]">{item.label}</div>
            {item.subtext && <div className="text-sm text-[#888888] mt-1">{item.subtext}</div>}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-white mb-1">{payment.project}</h3>
                <p className="text-sm text-[#888888]">by {payment.freelancer}</p>
              </div>
              <span className={`px-4 py-2 ${payment.statusColor} text-white font-bold rounded-full text-sm`}>
                {payment.status}
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 text-sm text-[#888888]">
                <span>Invoice: {payment.invoice}</span>
                <span>Date: {payment.date}</span>
                <span className="text-[#F5C800] font-bold">{payment.amount}</span>
              </div>
              <Link
                to={`/dashboard/client/payments/${payment.id}`}
                className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                View Invoice
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
