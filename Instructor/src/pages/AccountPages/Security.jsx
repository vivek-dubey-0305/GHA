import { useState } from 'react';
import { Shield, Eye, EyeOff, Save, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { apiClient } from '../../utils/api.utils';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Security() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setSuccess('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => setShowPasswords(s => ({ ...s, [field]: !s[field] }));

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600 pr-10";

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-7 h-7 text-white" />
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Security</h1>
          </div>
          <p className="text-gray-500">Manage your account security</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-6">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Current Password</label>
              <div className="relative">
                <input type={showPasswords.current ? 'text' : 'password'} value={form.currentPassword}
                  onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter current password" required className={inputClass} />
                <button type="button" onClick={() => toggleShow('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">New Password</label>
              <div className="relative">
                <input type={showPasswords.new ? 'text' : 'password'} value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 8 chars)" required minLength={8} className={inputClass} />
                <button type="button" onClick={() => toggleShow('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Confirm New Password</label>
              <div className="relative">
                <input type={showPasswords.confirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password" required className={inputClass} />
                <button type="button" onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        {/* Security Tips */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 mt-6">
          <h3 className="text-white font-semibold mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-gray-600 mt-2 shrink-0"></div>Use a strong, unique password with at least 8 characters</li>
            <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-gray-600 mt-2 shrink-0"></div>Include uppercase, lowercase, numbers, and special characters</li>
            <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-gray-600 mt-2 shrink-0"></div>Never share your password with anyone</li>
            <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-gray-600 mt-2 shrink-0"></div>Change your password regularly</li>
          </ul>
        </div>
      </div>
    </InstructorLayout>
  );
}
