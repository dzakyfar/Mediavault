import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function PostJobPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    budget: '',
    deadline: '',
    city: '',
  });
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePublish = () => {
    navigate('/dashboard/client');
  };

  return (
    <DashboardLayout userType="client" userName="Rania K.">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard/client" className="flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>

        <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Post a New Job
        </h1>

        <div className="flex items-center justify-between mb-12">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                step >= num ? 'bg-[#F5C800] text-black' : 'bg-[#141414] text-[#888888]'
              }`}>
                {step > num ? <Check className="w-6 h-6" /> : num}
              </div>
              {num < 3 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step > num ? 'bg-[#F5C800]' : 'bg-[#2A2A2A]'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Job Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Wedding Photography in Bali"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  >
                    <option value="">Select a category</option>
                    <option value="wedding">Wedding</option>
                    <option value="product">Product</option>
                    <option value="fashion">Fashion</option>
                    <option value="corporate">Corporate</option>
                    <option value="concert">Concert</option>
                    <option value="real-estate">Real Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what you need..."
                    rows={6}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Reference Files (Optional)</label>
                  <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-8 text-center hover:border-[#F5C800] transition-colors cursor-pointer">
                    <p className="text-[#888888]">Click to upload or drag and drop</p>
                    <p className="text-sm text-[#888888] mt-2">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Budget & Timeline
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Budget (Rp)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g. 1500000"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Preferred Location</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  >
                    <option value="">Select a city</option>
                    <option value="jakarta">Jakarta</option>
                    <option value="surabaya">Surabaya</option>
                    <option value="bandung">Bandung</option>
                    <option value="yogyakarta">Yogyakarta</option>
                    <option value="bali">Bali</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Review & Publish
              </h2>
              <div className="space-y-6">
                <div className="bg-[#141414] rounded-lg p-6">
                  <h3 className="font-bold mb-4">Job Summary</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[#888888]">Title: </span>
                      <span className="text-white">{formData.title || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Category: </span>
                      <span className="text-white capitalize">{formData.category || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Budget: </span>
                      <span className="text-[#F5C800] font-bold">Rp {formData.budget || '0'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Deadline: </span>
                      <span className="text-white">{formData.deadline || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Location: </span>
                      <span className="text-white capitalize">{formData.city || 'Not set'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141414] rounded-lg p-6">
                  <h3 className="font-bold mb-2">Description</h3>
                  <p className="text-[#888888]">{formData.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2A2A2A]">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-[#888888] rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div></div>}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all ml-auto"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all ml-auto"
              >
                Publish Job
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
