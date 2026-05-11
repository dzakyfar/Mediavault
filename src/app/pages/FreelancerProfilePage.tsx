import { useState } from 'react';
import { Star, MapPin, Clock, CheckCircle, Camera, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function FreelancerProfilePage() {
  const [activeTab, setActiveTab] = useState('portfolio');

  const portfolioItems = [
    { id: 1, title: 'Fashion Editorial 2026', category: 'Fashion' },
    { id: 2, title: 'Product Photography - Cosmetics', category: 'Product' },
    { id: 3, title: 'Corporate Headshots', category: 'Corporate' },
    { id: 4, title: 'Wedding - Sarah & Michael', category: 'Wedding' },
    { id: 5, title: 'Street Fashion Lookbook', category: 'Fashion' },
    { id: 6, title: 'Food Photography', category: 'Product' },
  ];

  const reviews = [
    { name: 'Rania K.', rating: 5, comment: 'Excellent work! Very professional and delivered on time.', date: 'March 2026', project: 'Brand Product Shoot' },
    { name: 'Budi S.', rating: 5, comment: 'Great photographer, highly recommended!', date: 'February 2026', project: 'Corporate Event' },
    { name: 'Sarah M.', rating: 4, comment: 'Good quality photos, would work with again.', date: 'February 2026', project: 'Fashion Editorial' },
  ];

  const packages = [
    {
      name: 'Basic',
      price: 'Rp 500K',
      features: ['10 edited photos', '2 hours coverage', 'Online delivery', '48h turnaround'],
    },
    {
      name: 'Standard',
      price: 'Rp 1.2M',
      features: ['30 edited photos', '4 hours coverage', 'Online delivery', 'Same location', '24h turnaround'],
      highlighted: true,
    },
    {
      name: 'Premium',
      price: 'Rp 2.5M',
      features: ['50+ edited photos', 'Full day coverage', 'Multiple locations', 'Raw files included', '12h turnaround'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <div className="relative h-96 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]">
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 py-8 w-full">
            <div className="flex items-end gap-8">
              <div className="w-32 h-32 rounded-full bg-[#141414] flex items-center justify-center text-[#F5C800] text-4xl font-bold border-4 border-[#F5C800]">
                F
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Fauzan Ardiansyah
                  </h1>
                  <span className="px-3 py-1 bg-[#22C55E] text-white rounded-full text-sm font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                </div>
                <p className="text-xl text-[#888888] mb-4">Commercial & Product Photographer | Surabaya</p>
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-5 h-5 text-[#F5C800] fill-current" />
                  <span className="font-bold">4.9</span>
                  <span className="text-[#888888]">(47 reviews)</span>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
                    Hire Now
                  </button>
                  <button className="flex items-center gap-2 px-8 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all">
                    <MessageCircle className="w-5 h-5" />
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border-y border-[#2A2A2A] mb-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F5C800] mb-1">128</div>
              <div className="text-sm text-[#888888]">Projects Done</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F5C800] mb-1">Rp 500K</div>
              <div className="text-sm text-[#888888]">Starting Price</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F5C800] mb-1">{'< 24h'}</div>
              <div className="text-sm text-[#888888]">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F5C800] mb-1">100%</div>
              <div className="text-sm text-[#888888]">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-2 mb-8 border-b border-[#2A2A2A]">
          {['portfolio', 'about', 'reviews', 'packages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'text-[#F5C800] border-b-2 border-[#F5C800]'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'portfolio' && (
          <div>
            <div className="flex gap-2 mb-6">
              <button className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg">All</button>
              <button className="px-4 py-2 bg-[#141414] text-[#888888] rounded-lg hover:text-white transition-colors">Fashion</button>
              <button className="px-4 py-2 bg-[#141414] text-[#888888] rounded-lg hover:text-white transition-colors">Product</button>
              <button className="px-4 py-2 bg-[#141414] text-[#888888] rounded-lg hover:text-white transition-colors">Corporate</button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <div key={item.id} className="group relative bg-[#141414] rounded-xl overflow-hidden border border-[#2A2A2A] hover:border-[#F5C800] transition-all cursor-pointer">
                  <div className="aspect-square bg-[#1A1A1A] flex items-center justify-center">
                    <Camera className="w-16 h-16 text-[#888888]" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <span className="inline-block px-3 py-1 bg-[#F5C800] text-black rounded-full text-xs font-bold">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                About Me
              </h2>
              <p className="text-[#888888] mb-6">
                Professional photographer with 5+ years of experience in commercial and product photography.
                Specialized in creating high-quality images that tell your brand's story. Based in Surabaya,
                available for projects across Indonesia.
              </p>
              <h3 className="text-xl font-bold mb-3">Equipment</h3>
              <ul className="text-[#888888] space-y-2 mb-6">
                <li>• Sony A7R IV</li>
                <li>• Canon EOS R5</li>
                <li>• Multiple professional lenses</li>
                <li>• Professional lighting setup</li>
              </ul>
              <h3 className="text-xl font-bold mb-3">Service Area</h3>
              <div className="flex items-center gap-2 text-[#888888]">
                <MapPin className="w-5 h-5 text-[#F5C800]" />
                <span>Surabaya, East Java & surrounding areas</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  'Product Photography',
                  'Commercial Photography',
                  'Fashion Photography',
                  'Studio Lighting',
                  'Photo Editing',
                  'Retouching',
                  'Brand Photography',
                  'E-commerce Photos'
                ].map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-[#141414] border border-[#2A2A2A] rounded-lg text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {reviews.map((review, i) => (
              <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold mb-1">{review.name}</div>
                    <div className="text-sm text-[#888888]">{review.project}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-[#F5C800] fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-[#888888] mb-3">{review.comment}</p>
                <div className="text-sm text-[#888888]">{review.date}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <div
                key={i}
                className={`rounded-xl p-8 ${
                  pkg.highlighted
                    ? 'bg-[#141414] border-4 border-[#F5C800] shadow-[0_0_40px_rgba(245,200,0,0.3)] scale-105'
                    : 'bg-[#141414] border-2 border-[#2A2A2A]'
                } relative`}
              >
                {pkg.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F5C800] text-black text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {pkg.name}
                </h3>
                <div className="text-4xl font-bold text-[#F5C800] mb-6">{pkg.price}</div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#F5C800] flex-shrink-0 mt-0.5" />
                      <span className="text-[#888888]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`block w-full py-3 rounded-full font-bold text-center transition-all ${
                    pkg.highlighted
                      ? 'bg-[#F5C800] text-black hover:shadow-[0_0_20px_rgba(245,200,0,0.4)]'
                      : 'border-2 border-[#888888] text-white hover:border-[#F5C800] hover:text-[#F5C800]'
                  }`}
                >
                  Book This Package
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
