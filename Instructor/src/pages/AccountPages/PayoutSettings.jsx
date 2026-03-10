import { useEffect, useState } from 'react';
import { Settings, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

export default function PayoutSettings() {
  const [form, setForm] = useState({
    bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '', upiId: '', preferredMethod: 'bank'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/instructor/profile');
        const data = res.data?.data;
        if (data?.payoutSettings) {
          setForm(f => ({ ...f, ...data.payoutSettings }));
        }
      } catch {
        console.log("Error occured : /instructor/profile")
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      await apiClient.put('/instructor/preferences', { payoutSettings: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600";

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-7 h-7 text-white" />
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Payout Settings</h1>
          </div>
          <p className="text-gray-500">Configure your bank details for payouts</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-6">
            <CheckCircle className="w-4 h-4 shrink-0" /> Settings saved successfully
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold mb-2">Bank Account Details</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Bank Name</label>
              <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                placeholder="e.g., State Bank of India" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Account Holder Name</label>
              <input value={form.accountHolderName} onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))}
                placeholder="Full name as on bank account" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Account Number</label>
                <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="Account number" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">IFSC Code</label>
                <input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value }))}
                  placeholder="e.g., SBIN0001234" className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold mb-2">UPI (Optional)</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">UPI ID</label>
              <input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                placeholder="yourname@upi" className={inputClass} />
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold mb-2">Preferred Method</h2>
            <div className="flex gap-4">
              {['bank', 'upi'].map(method => (
                <label key={method} className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${form.preferredMethod === method ? 'border-white text-white bg-white/5' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                  <input type="radio" name="preferredMethod" value={method} checked={form.preferredMethod === method}
                    onChange={e => setForm(f => ({ ...f, preferredMethod: e.target.value }))} className="hidden" />
                  {method === 'bank' ? 'Bank Transfer' : 'UPI'}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </InstructorLayout>
  );
}
