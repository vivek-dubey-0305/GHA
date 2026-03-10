import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Tag, Plus, RefreshCw, Trash2, Edit2, X, Copy, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { getMyCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../redux/slices/coupon.slice';
import { getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Coupons() {
  const dispatch = useDispatch();
  const { coupons, loading, error, pagination } = useSelector(s => s.coupon);
  const { courses } = useSelector(s => s.course);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState('');
  const [form, setForm] = useState({
    code: '', course: '', discountType: 'percentage', discountValue: '', maxDiscount: '',
    minPurchaseAmount: '', usageLimit: '', perUserLimit: '1', startDate: '', expiryDate: '', description: ''
  });

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyCoupons({ page, limit: 10 }));
    dispatch(getMyCourses({ page: 1, limit: 100 }));
  }, [dispatch, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, discountValue: Number(form.discountValue) };
    if (form.maxDiscount) data.maxDiscount = Number(form.maxDiscount);
    if (form.minPurchaseAmount) data.minPurchaseAmount = Number(form.minPurchaseAmount);
    if (form.usageLimit) data.usageLimit = Number(form.usageLimit);
    if (form.perUserLimit) data.perUserLimit = Number(form.perUserLimit);
    if (!data.course) delete data.course;
    if (!data.maxDiscount) delete data.maxDiscount;
    if (!data.minPurchaseAmount) delete data.minPurchaseAmount;
    if (!data.usageLimit) delete data.usageLimit;

    if (editId) {
      await dispatch(updateCoupon({ id: editId, data }));
    } else {
      await dispatch(createCoupon(data));
    }
    setShowForm(false);
    setEditId(null);
    resetForm();
    fetchData();
  };

  const resetForm = () => setForm({
    code: '', course: '', discountType: 'percentage', discountValue: '', maxDiscount: '',
    minPurchaseAmount: '', usageLimit: '', perUserLimit: '1', startDate: '', expiryDate: '', description: ''
  });

  const handleEdit = (c) => {
    setForm({
      code: c.code, course: c.course?._id || '', discountType: c.discountType, discountValue: c.discountValue,
      maxDiscount: c.maxDiscount || '', minPurchaseAmount: c.minPurchaseAmount || '',
      usageLimit: c.usageLimit || '', perUserLimit: c.perUserLimit || '1',
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
      description: c.description || ''
    });
    setEditId(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this coupon?')) await dispatch(deleteCoupon(id));
  };

  const handleToggle = async (c) => {
    await dispatch(updateCoupon({ id: c._id, data: { isActive: !c.isActive } }));
    fetchData();
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Tag className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Coupons & Promotions</h1>
            </div>
            <p className="text-gray-500">Manage discount codes for your courses</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 text-sm">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'Create'} Coupon</h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Coupon Code</label>
                  <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER2025" required
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm uppercase placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Discount Type</label>
                    <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm">
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Discount Value</label>
                    <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                      placeholder={form.discountType === 'percentage' ? '20' : '500'} required min="1"
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Course (optional - leave blank for all)</label>
                  <select value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm">
                    <option value="">All Courses</option>
                    {(courses || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max Discount (₹)</label>
                    <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Usage Limit</label>
                    <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                      placeholder="Unlimited"
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Expiry Date</label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-gray-600" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                </div>
                <button type="submit" className="w-full px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 text-sm">
                  {editId ? 'Update' : 'Create'} Coupon
                </button>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-gray-800 rounded w-32 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-48"></div>
              </div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Tag className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No coupons yet</h3>
            <p className="text-gray-500 text-sm">Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map(c => (
              <div key={c._id} className={`bg-[#111] border rounded-xl p-5 transition-colors ${c.isActive ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800/50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => copyCode(c.code)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-gray-700 rounded-lg text-white font-mono text-sm hover:bg-white/10 transition-colors">
                        {c.code}
                        {copiedCode === c.code ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                      </button>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-400 bg-green-400/10">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      </span>
                      {!c.isActive && <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-400/10">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {c.course?.title && <span>{c.course.title}</span>}
                      <span>Used: {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</span>
                      {c.expiryDate && <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>}
                      {c.description && <span>{c.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(c)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                      {c.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleEdit(c)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30">Prev</button>
            <span className="text-gray-500 text-sm">Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
