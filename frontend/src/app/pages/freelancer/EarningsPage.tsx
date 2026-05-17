import { Download } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function FreelancerEarnings() {
  const summary = [
    { label: 'Total Earned', value: 'Rp 12.500.000', color: 'text-[#F5C800]' },
    { label: 'This Month', value: 'Rp 2.250.000', color: 'text-[#F5C800]' },
    { label: 'Pending', value: 'Rp 750.000', color: 'text-[#F97316]' },
  ];

  const transactions = [
    { client: 'Rania K.', project: 'Brand Product Shoot', date: '5 Mar 2026', amount: 'Rp 1.500.000', status: 'Received', statusColor: 'bg-[#22C55E]' },
    { client: 'Budi S.', project: 'Corporate Event Coverage', date: '28 Feb 2026', amount: 'Rp 2.000.000', status: 'Pending', statusColor: 'bg-[#F97316]' },
    { client: 'Sarah M.', project: 'Fashion Editorial Shoot', date: '20 Feb 2026', amount: 'Rp 2.500.000', status: 'Received', statusColor: 'bg-[#22C55E]' },
  ];

  const monthlyData = [
    { month: 'Oct', earned: 1500000, pending: 500000 },
    { month: 'Nov', earned: 2200000, pending: 300000 },
    { month: 'Dec', earned: 1800000, pending: 400000 },
    { month: 'Jan', earned: 2500000, pending: 200000 },
    { month: 'Feb', earned: 2100000, pending: 600000 },
    { month: 'Mar', earned: 2250000, pending: 750000 },
  ];

  const maxValue = Math.max(...monthlyData.map(d => d.earned + d.pending));

  return (
    <DashboardLayout userType="freelancer" userName="Fauzan A.">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Earnings
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {summary.map((item, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className={`text-3xl font-bold mb-2 ${item.color}`}>{item.value}</div>
            <div className="text-[#888888]">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Monthly Earnings
        </h2>
        <div className="flex items-end gap-4 h-64">
          {monthlyData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1">
                <div
                  className="w-full bg-[#F5C800] rounded-t"
                  style={{ height: `${(data.earned / maxValue) * 200}px` }}
                ></div>
                <div
                  className="w-full bg-[#F97316] rounded-t"
                  style={{ height: `${(data.pending / maxValue) * 200}px` }}
                ></div>
              </div>
              <span className="text-sm text-[#888888]">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#F5C800] rounded"></div>
            <span className="text-sm text-[#888888]">Earned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#F97316] rounded"></div>
            <span className="text-sm text-[#888888]">Pending</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Transaction History
        </h2>
        <div className="space-y-4">
          {transactions.map((transaction, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white mb-1">{transaction.project}</h3>
                  <p className="text-sm text-[#888888]">from {transaction.client}</p>
                </div>
                <div className="text-right">
                  <div className="text-[#F5C800] font-bold mb-1">{transaction.amount}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#888888]">{transaction.date}</span>
                    <span className={`px-3 py-1 ${transaction.statusColor} text-white font-bold rounded-full text-xs`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full px-8 py-4 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all flex items-center justify-center gap-2">
        <Download className="w-5 h-5" />
        Withdraw Funds
      </button>
    </DashboardLayout>
  );
}
