import { Link } from 'react-router';
import { Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: 'Rp 0',
      period: '/month',
      features: [
        '1 job posting',
        '3 messages per month',
        'Basic features',
        'Community support'
      ],
      highlighted: false
    },
    {
      name: 'Pro',
      price: 'Rp 99K',
      period: '/month',
      badge: 'Most Popular',
      features: [
        'Unlimited job postings',
        'Unlimited messages',
        'Verified badge',
        'Priority support',
        'Advanced analytics',
        'Featured listings'
      ],
      highlighted: true
    },
    {
      name: 'Studio',
      price: 'Rp 299K',
      period: '/month',
      features: [
        'Everything in Pro',
        '1TB NAS storage',
        'Multi-user accounts',
        'Custom branding',
        'Advanced analytics',
        'Dedicated account manager'
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Simple Pricing. No Hidden Fees.
          </h1>
          <div className="inline-flex items-center gap-4 bg-[#141414] border border-[#2A2A2A] rounded-full p-1">
            <button className="px-6 py-2 bg-[#F5C800] text-black font-bold rounded-full">
              Monthly
            </button>
            <button className="px-6 py-2 text-[#888888] hover:text-white transition-colors">
              Yearly
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-xl p-8 ${
                plan.highlighted
                  ? 'bg-[#141414] border-4 border-[#F5C800] shadow-[0_0_40px_rgba(245,200,0,0.3)] scale-105'
                  : 'bg-[#141414] border-2 border-[#2A2A2A]'
              } relative`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F5C800] text-black text-sm font-bold rounded-full">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-[#F5C800]">{plan.price}</span>
                <span className="text-[#888888]">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#F5C800] flex-shrink-0 mt-0.5" />
                    <span className="text-[#888888]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block w-full py-3 rounded-full font-bold text-center transition-all ${
                  plan.highlighted
                    ? 'bg-[#F5C800] text-black hover:shadow-[0_0_20px_rgba(245,200,0,0.4)]'
                    : 'border-2 border-[#888888] text-white hover:border-[#F5C800] hover:text-[#F5C800]'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-4xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, bank transfers, and Indonesian e-wallets.'
              },
              {
                q: 'Is there a free trial?',
                a: 'The Free plan is available forever. You can upgrade to Pro or Studio at any time.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 text-left">
                <h4 className="font-bold mb-2 text-white">{faq.q}</h4>
                <p className="text-[#888888]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
