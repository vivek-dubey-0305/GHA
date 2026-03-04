import { Search, MoreVertical, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from '../ui';
import {
  freezeWallet,
  unfreezeWallet,
  selectFreezeWalletLoading,
  selectUnfreezeWalletLoading,
} from '../../redux/slices/wallet.slice.js';

export function ListWallet({ wallets, pagination, onWalletClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const freezeLoading = useSelector(selectFreezeWalletLoading);
  const unfreezeLoading = useSelector(selectUnfreezeWalletLoading);

  const filteredWallets = wallets.filter(wallet =>
    (wallet._id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (wallet.owner?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (wallet.owner?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (wallet.owner?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (wallet.ownerModel?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleFreezeClick = async (e, wallet) => {
    e.stopPropagation();
    try {
      await dispatch(freezeWallet({
        walletId: wallet._id,
        reason: 'Admin freeze'
      })).unwrap();
    } catch (error) {
      console.error('Failed to freeze wallet:', error);
    }
  };

  const handleUnfreezeClick = async (e, wallet) => {
    e.stopPropagation();
    try {
      await dispatch(unfreezeWallet(wallet._id)).unwrap();
    } catch (error) {
      console.error('Failed to unfreeze wallet:', error);
    }
  };

  const getStatusBadge = (isActive, isFrozen) => {
    if (isFrozen) return 'bg-red-500/20 text-red-400';
    if (isActive) return 'bg-green-500/20 text-green-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  const getStatusText = (isActive, isFrozen) => {
    if (isFrozen) return 'Frozen';
    if (isActive) return 'Active';
    return 'Inactive';
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Wallets</h1>
        <p className="text-gray-400">Manage user and instructor wallets</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by wallet ID, owner name, email or type..."
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Wallet ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Owner</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Balance</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Available</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Hold Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Last Transaction</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.map((wallet) => (
                <tr
                  key={wallet._id}
                  onClick={() => onWalletClick(wallet)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-300" title={wallet._id}>
                      {wallet._id?.substring(0, 10)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white text-sm">
                        {wallet.owner?.firstName} {wallet.owner?.lastName}
                      </span>
                      <span className="text-gray-500 text-xs">{wallet.owner?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-xs">
                      {wallet.ownerModel}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    ₹{wallet.balance?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    ₹{wallet.availableBalance?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-yellow-400">
                    ₹{wallet.holdAmount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={getStatusBadge(wallet.isActive, wallet.isFrozen)}
                    >
                      {getStatusText(wallet.isActive, wallet.isFrozen)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {wallet.lastTransactionAt ? new Date(wallet.lastTransactionAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {wallet.isFrozen ? (
                        <button
                          className="text-gray-400 hover:text-green-400 transition-colors p-2"
                          onClick={(e) => handleUnfreezeClick(e, wallet)}
                          title="Unfreeze wallet"
                        >
                          {unfreezeLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          className="text-gray-400 hover:text-red-400 transition-colors p-2"
                          onClick={(e) => handleFreezeClick(e, wallet)}
                          title="Freeze wallet"
                        >
                          {freezeLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWalletClick(wallet);
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
          Showing {filteredWallets.length} of {pagination?.totalItems ?? wallets.length} wallets
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