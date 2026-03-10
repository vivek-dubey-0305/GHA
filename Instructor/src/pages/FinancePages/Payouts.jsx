import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowUpRight, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Banknote
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyPayouts, getMyPayoutStats, requestPayout,
  selectPayouts, selectPayoutsPagination, selectPayoutsLoading,
  selectPayoutStats, selectWallet, getMyWallet
} from '../../redux/slices/earnings.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Payouts() {
  const dispatch = useDispatch();
  const payouts = useSelector(selectPayouts) || [];
  const pagination = useSelector(selectPayoutsPagination);
  const loading = useSelector(selectPayoutsLoading);
  const stats = useSelector(selectPayoutStats);
  const wallet = useSelector(selectWallet);
  const [page, setPage] = useState(1);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyPayouts({ page, limit: 10 }));
    dispatch(getMyPayoutStats());
    dispatch(getMyWallet());
  }, [dispatch, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setRequesting(true);
    await dispatch(requestPayout(Number(amount)));
    setShowRequest(false);
    setAmount('');
    setRequesting(false);
    fetchData();
  };

  const statusIcons = { completed: CheckCircle, pending: Clock, processing: Clock, failed: XCircle, cancelled: XCircle };
  const statusColors = { completed: 'text-green-400', pending: 'text-yellow-400', processing: 'text-blue-400', failed: 'text-red-400', cancelled: 'text-gray-400' };

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Banknote className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Payouts</h1>
            </div>
            <p className="text-gray-500">Request and track your payouts</p>
          </div>
          <button onClick={() => setShowRequest(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 text-sm">
            <ArrowUpRight className="w-4 h-4" /> Request Payout
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Available Balance', value: `₹${(wallet?.balance || 0).toLocaleString()}` },
              { label: 'Total Paid Out', value: `₹${(stats.totalPaidOut || 0).toLocaleString()}` },
              { label: 'Pending', value: `₹${(stats.pendingAmount || 0).toLocaleString()}` },
              { label: 'Total Requests', value: stats.totalRequests || 0 },
            ].map((s, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Request Modal */}
        {showRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Request Payout</h2>
              <p className="text-sm text-gray-400 mb-4">Available: ₹{(wallet?.balance || 0).toLocaleString()}</p>
              <form onSubmit={handleRequest} className="space-y-4">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Amount (₹)" required min="1" max={wallet?.balance || 0}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowRequest(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-800 rounded-lg text-gray-400 text-sm hover:border-gray-600">Cancel</button>
                  <button type="submit" disabled={requesting}
                    className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
                    {requesting ? 'Requesting...' : 'Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Payouts List */}
        {loading && (payouts?.length === 0 || !Array.isArray(payouts)) ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-gray-800 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-48"></div>
              </div>
            ))}
          </div>

        ) : !Array.isArray(payouts) || payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Banknote className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No payouts yet</h3>
            <p className="text-gray-500 text-sm">Request your first payout when you have earnings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map(p => {
              const Icon = statusIcons[p.status] || Clock;
              const color = statusColors[p.status] || 'text-gray-400';
              return (
                <div key={p._id} className="bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <p className="text-white font-medium">₹{(p.amount || 0).toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString()} • {p.method || 'Bank Transfer'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color} bg-white/5`}>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-gray-500 text-sm">Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
