import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Receipt, RefreshCw, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyTransactions, selectTransactions, selectTransactionsPagination, selectTransactionsLoading
} from '../../redux/slices/earnings.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Transactions() {
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions) || [];
  const pagination = useSelector(selectTransactionsPagination);
  const loading = useSelector(selectTransactionsLoading);
  const [page, setPage] = useState(1);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyTransactions({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Receipt className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Transactions</h1>
            </div>
            <p className="text-gray-500">Complete history of your financial transactions</p>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading && (transactions?.length === 0 || !Array.isArray(transactions)) ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-40"></div>
                    <div className="h-3 bg-gray-800 rounded w-24"></div>
                  </div>
                  <div className="h-5 bg-gray-800 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Receipt className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No transactions yet</h3>
            <p className="text-gray-500 text-sm">Transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isCredit = tx.type === 'credit' || tx.type === 'earning';
              return (
                <div key={tx._id} className="bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
                        {isCredit ? <ArrowDownRight className="w-5 h-5 text-green-400" /> : <ArrowUpRight className="w-5 h-5 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{tx.description || tx.type}</p>
                        <p className="text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}₹{(tx.amount || 0).toLocaleString()}
                    </p>
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
