import { Link } from 'react-router';
import { ArrowLeft, Download, Zap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function ClientPaymentDetail() {
  return (
    <DashboardLayout userType="client" userName="Rania K.">
      <div className="mb-6">
        <Link to="/dashboard/client/payments" className="flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Dashboard → Payments → Invoice #INV-2026-001</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-12">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-[#F5C800]" />
              <span className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>INVOICE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-[#2A2A2A]">
            <div>
              <div className="text-sm text-[#888888] mb-1">Invoice Number</div>
              <div className="font-bold">#INV-2026-001</div>
            </div>
            <div>
              <div className="text-sm text-[#888888] mb-1">Issue Date</div>
              <div className="font-bold">1 Mar 2026</div>
            </div>
            <div>
              <div className="text-sm text-[#888888] mb-1">Due Date</div>
              <div className="font-bold text-[#F97316]">10 Mar 2026</div>
            </div>
            <div>
              <div className="text-sm text-[#888888] mb-1">Status</div>
              <span className="inline-block px-3 py-1 bg-[#F97316] text-white font-bold rounded-full text-sm">
                PENDING PAYMENT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-[#2A2A2A]">
            <div>
              <div className="text-sm text-[#888888] mb-2">From</div>
              <div className="font-bold">Raja Jawa Studio</div>
              <div className="text-sm text-[#888888]">MediaVault Platform</div>
            </div>
            <div>
              <div className="text-sm text-[#888888] mb-2">To</div>
              <div className="font-bold">Rania K.</div>
              <div className="text-sm text-[#888888]">rania.k@email.com</div>
              <div className="text-sm text-[#888888]">+62 812-3456-7890</div>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left text-sm text-[#888888] pb-3">Description</th>
                  <th className="text-right text-sm text-[#888888] pb-3">Qty</th>
                  <th className="text-right text-sm text-[#888888] pb-3">Unit Price</th>
                  <th className="text-right text-sm text-[#888888] pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#2A2A2A]">
                  <td className="py-4">Brand Product Shoot</td>
                  <td className="text-right py-4">1</td>
                  <td className="text-right py-4">Rp 1.500.000</td>
                  <td className="text-right py-4">Rp 1.500.000</td>
                </tr>
                <tr className="border-b border-[#2A2A2A]">
                  <td className="py-4 text-[#888888]">Platform Fee (5%)</td>
                  <td className="text-right py-4"></td>
                  <td className="text-right py-4"></td>
                  <td className="text-right py-4">Rp 75.000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-[#888888]">
                <span>Subtotal</span>
                <span>Rp 1.575.000</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#2A2A2A]">
                <span className="font-bold text-xl">TOTAL</span>
                <span className="font-bold text-xl text-[#F5C800]">Rp 1.575.000</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 px-6 py-4 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
              Pay Now
            </button>
            <button className="flex items-center gap-2 px-6 py-4 border border-[#888888] rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors">
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
