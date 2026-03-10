import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  Wallet, ArrowUpRight, ArrowDownRight, Clock, TrendingUp,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyWallet, getMyTransactions, getMyPayouts, getMyPayoutStats,
  selectWallet, selectWalletLoading, selectWalletError,
  selectTransactions, selectTransactionsPagination, selectTransactionsLoading,
  selectPayouts, selectPayoutsPagination, selectPayoutsLoading,
  selectPayoutStats,
} from '../../redux/slices/earnings.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Earnings() {
  const dispatch = useDispatch();
  const wallet = useSelector(selectWallet);
  const walletLoading = useSelector(selectWalletLoading);
  const walletError = useSelector(selectWalletError);
  const transactions = useSelector(selectTransactions);
  const txPagination = useSelector(selectTransactionsPagination);
  const txLoading = useSelector(selectTransactionsLoading);
  const payouts = useSelector(selectPayouts);
  const payoutPagination = useSelector(selectPayoutsPagination);
  const payoutsLoading = useSelector(selectPayoutsLoading);
  const payoutStats = useSelector(selectPayoutStats);

  const [tab, setTab] = useState('overview');
  const [txPage, setTxPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyWallet());
    dispatch(getMyPayoutStats());
    dispatch(getMyTransactions({ page: txPage, limit: 15 }));
    dispatch(getMyPayouts({ page: payoutPage, limit: 10 }));
  }, [dispatch, txPage, payoutPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isLoading = walletLoading && !wallet;

  if (walletError && !wallet) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4"><AlertTriangle className="w-10 h-10 text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load earnings</h2>
            <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors mt-4">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <DollarSign className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Earnings</h1>
            </div>
            <p className="text-gray-500">Track your revenue and payouts</p>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Wallet Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-[100px]" />
            ))}
          </div>
        ) : wallet && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Balance" value={`₹${(wallet.balance || 0).toLocaleString()}`} />
            <StatCard icon={TrendingUp} label="Total Earned" value={`₹${(wallet.totalEarned || 0).toLocaleString()}`} />
            <StatCard icon={ArrowUpRight} label="Total Withdrawn" value={`₹${(wallet.totalWithdrawn || 0).toLocaleString()}`} />
            <StatCard
              icon={Clock}
              label="Pending Payouts"
              value={payoutStats?.pending?.count ?? 0}
              sub={payoutStats?.pending?.amount ? `₹${payoutStats.pending.amount.toLocaleString()}` : null}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] border border-gray-800 rounded-lg p-1 w-fit">
          {['overview', 'transactions', 'payouts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm">Recent Transactions</h3>
            {txLoading && !transactions.length ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse h-[60px]" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => (
                  <TransactionRow key={tx._id} tx={tx} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No transactions yet</p>
            )}

            <h3 className="text-white font-semibold text-sm pt-4">Recent Payouts</h3>
            {payoutsLoading && !payouts.length ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse h-[60px]" />
                ))}
              </div>
            ) : payouts.length > 0 ? (
              <div className="space-y-2">
                {payouts.slice(0, 3).map(p => (
                  <PayoutRow key={p._id} payout={p} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No payouts yet</p>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          <div className="space-y-3">
            {txLoading && !transactions.length ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse h-[60px]" />
              ))
            ) : transactions.length > 0 ? (
              <>
                {transactions.map(tx => <TransactionRow key={tx._id} tx={tx} />)}

                {txPagination && txPagination.totalPages > 1 && (
                  <Pagination page={txPage} totalPages={txPagination.totalPages} setPage={setTxPage} />
                )}
              </>
            ) : (
              <EmptyState icon={DollarSign} title="No transactions" desc="Your transaction history will appear here" />
            )}
          </div>
        )}

        {/* Payouts Tab */}
        {tab === 'payouts' && (
          <div className="space-y-3">
            {payoutsLoading && !payouts.length ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse h-[60px]" />
              ))
            ) : payouts.length > 0 ? (
              <>
                {payouts.map(p => <PayoutRow key={p._id} payout={p} />)}

                {payoutPagination && payoutPagination.totalPages > 1 && (
                  <Pagination page={payoutPage} totalPages={payoutPagination.totalPages} setPage={setPayoutPage} />
                )}
              </>
            ) : (
              <EmptyState icon={ArrowUpRight} title="No payouts" desc="Your payout history will appear here" />
            )}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/5"><Icon className="w-4 h-4 text-gray-400" /></div>
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function TransactionRow({ tx }) {
  const isCredit = tx.type === 'credit';
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg ${isCredit ? 'bg-white/5' : 'bg-white/5'}`}>
          {isCredit ? <ArrowDownRight className="w-4 h-4 text-gray-300" /> : <ArrowUpRight className="w-4 h-4 text-gray-500" />}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{tx.description || tx.type}</p>
          <p className="text-gray-600 text-xs">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${isCredit ? 'text-white' : 'text-gray-500'}`}>
        {isCredit ? '+' : '-'}₹{(tx.amount || 0).toLocaleString()}
      </span>
    </div>
  );
}

function PayoutRow({ payout }) {
  const statusColors = {
    pending: 'text-gray-300 border-gray-600',
    processing: 'text-gray-300 border-gray-600',
    completed: 'text-gray-500 border-gray-700',
    failed: 'text-gray-500 border-gray-800',
    cancelled: 'text-gray-600 border-gray-800',
  };
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-white text-sm font-medium">₹{(payout.amount || 0).toLocaleString()}</p>
        <p className="text-gray-600 text-xs">{payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : '—'}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColors[payout.status] || 'text-gray-500 border-gray-700'}`}>
        {payout.status}
      </span>
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-400">Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span></span>
      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="w-12 h-12 text-gray-700 mb-4" />
      <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}
