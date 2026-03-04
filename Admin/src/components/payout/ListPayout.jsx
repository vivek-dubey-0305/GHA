import { Search, MoreVertical, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from '../ui';
import {
  processPayout,
  completePayout,
  failPayout,
  adminCancelPayout,
  flagPayout,
  reviewPayout,
  selectProcessPayoutLoading,
  selectCompletePayoutLoading,
  selectFailPayoutLoading,
  selectAdminCancelPayoutLoading,
  selectFlagPayoutLoading,
  selectReviewPayoutLoading,
} from '../../redux/slices/payout.slice.js';

export function ListPayout({ payouts, pagination, onPayoutClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const processLoading = useSelector(selectProcessPayoutLoading);
  const completeLoading = useSelector(selectCompletePayoutLoading);
  const failLoading = useSelector(selectFailPayoutLoading);
  const cancelLoading = useSelector(selectAdminCancelPayoutLoading);
  const flagLoading = useSelector(selectFlagPayoutLoading);
  const reviewLoading = useSelector(selectReviewPayoutLoading);

  const filteredPayouts = payouts.filter(payout =>
    (payout._id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (payout.owner?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (payout.owner?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (payout.owner?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (payout.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (payout.method?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleProcessClick = async (e, payout) => {
    e.stopPropagation();
    try {
      await dispatch(processPayout(payout._id)).unwrap();
    } catch (error) {
      console.error('Failed to process payout:', error);
    }
  };

  const handleCompleteClick = async (e, payout) => {
    e.stopPropagation();
    try {
      await dispatch(completePayout({
        payoutId: payout._id,
        utr: `UTR${Date.now()}`,
        gatewayPayoutId: `PAY${Date.now()}`,
        notes: 'Completed by admin'
      })).unwrap();
    } catch (error) {
      console.error('Failed to complete payout:', error);
    }
  };

  const handleFailClick = async (e, payout) => {
    e.stopPropagation();
    try {
      await dispatch(failPayout({
        payoutId: payout._id,
        reason: 'Failed by admin',
        failureCode: 'ADMIN_FAIL'
      })).unwrap();
    } catch (error) {
      console.error('Failed to fail payout:', error);
    }
  };

  const getStatusBadge = (status, isFlagged) => {
    if (isFlagged) return 'bg-orange-500/20 text-orange-400';
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusText = (status, isFlagged) => {
    if (isFlagged) return 'Flagged';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Payouts</h1>
        <p className="text-gray-400">Manage fund withdrawal requests</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by payout ID, owner name, email, status or method..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-gray-600 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Payout ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Owner</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Method</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Requested</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Processed</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr
                  key={payout._id}
                  onClick={() => onPayoutClick(payout)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-300" title={payout._id}>
                      {payout._id?.substring(0, 10)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white text-sm">
                        {payout.owner?.firstName} {payout.owner?.lastName}
                      </span>
                      <span className="text-gray-500 text-xs">{payout.owner?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    ₹{payout.amount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-xs">
                      {payout.method === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={getStatusBadge(payout.status, payout.risk?.isFlagged)}
                    >
                      {getStatusText(payout.status, payout.risk?.isFlagged)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {payout.status === 'pending' && (
                        <button
                          className="text-gray-400 hover:text-blue-400 transition-colors p-2"
                          onClick={(e) => handleProcessClick(e, payout)}
                          title="Process payout"
                        >
                          {processLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Process'
                          )}
                        </button>
                      )}
                      {payout.status === 'processing' && (
                        <>
                          <button
                            className="text-gray-400 hover:text-green-400 transition-colors p-2"
                            onClick={(e) => handleCompleteClick(e, payout)}
                            title="Complete payout"
                          >
                            {completeLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Complete'
                            )}
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-400 transition-colors p-2"
                            onClick={(e) => handleFailClick(e, payout)}
                            title="Fail payout"
                          >
                            {failLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Fail'
                            )}
                          </button>
                        </>
                      )}
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayoutClick(payout);
                        }}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-400">
          Showing {filteredPayouts.length} of {pagination?.totalItems ?? payouts.length} payouts
          {pagination?.totalPages > 1 && (
            <span> &mdash; Page {pagination.currentPage} of {pagination.totalPages}</span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            disabled={!pagination?.hasPrevPage}
            onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled={!pagination?.hasNextPage}
            onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}