import { X, Save, Plus, Minus, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { Button, Input, Label, Separator } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  adminCreditWallet,
  adminDebitWallet,
  freezeWallet,
  unfreezeWallet,
  getWalletTransactions,
  selectAdminCreditWalletLoading,
  selectAdminDebitWalletLoading,
  selectFreezeWalletLoading,
  selectUnfreezeWalletLoading,
  selectWalletTransactions,
  selectWalletTransactionsLoading,
} from '../../redux/slices/wallet.slice.js';

export function EditWallet({ wallet, onClose, onSave }) {
  const dispatch = useDispatch();
  const creditLoading = useSelector(selectAdminCreditWalletLoading);
  const debitLoading = useSelector(selectAdminDebitWalletLoading);
  const freezeLoading = useSelector(selectFreezeWalletLoading);
  const unfreezeLoading = useSelector(selectUnfreezeWalletLoading);
  const transactions = useSelector(selectWalletTransactions);
  const transactionsLoading = useSelector(selectWalletTransactionsLoading);

  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [debitDescription, setDebitDescription] = useState('');
  const [freezeReason, setFreezeReason] = useState('');

  if (!wallet) return null;

  const handleCredit = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) return;
    try {
      await dispatch(adminCreditWallet({
        walletId: wallet._id,
        amount: parseFloat(creditAmount),
        description: creditDescription || 'Admin credit',
      })).unwrap();
      setCreditAmount('');
      setCreditDescription('');
      onSave();
    } catch (error) {
      console.error('Failed to credit wallet:', error);
    }
  };

  const handleDebit = async () => {
    if (!debitAmount || parseFloat(debitAmount) <= 0) return;
    try {
      await dispatch(adminDebitWallet({
        walletId: wallet._id,
        amount: parseFloat(debitAmount),
        description: debitDescription || 'Admin debit',
      })).unwrap();
      setDebitAmount('');
      setDebitDescription('');
      onSave();
    } catch (error) {
      console.error('Failed to debit wallet:', error);
    }
  };

  const handleFreeze = async () => {
    if (!freezeReason) return;
    try {
      await dispatch(freezeWallet({
        walletId: wallet._id,
        reason: freezeReason,
      })).unwrap();
      setFreezeReason('');
      onSave();
    } catch (error) {
      console.error('Failed to freeze wallet:', error);
    }
  };

  const handleUnfreeze = async () => {
    try {
      await dispatch(unfreezeWallet(wallet._id)).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to unfreeze wallet:', error);
    }
  };

  const handleViewTransactions = () => {
    dispatch(getWalletTransactions(wallet._id));
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Wallet</h2>
          <p className="text-sm text-gray-400 mt-1">Manage wallet balance and status</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Wallet Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Wallet Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Wallet ID</Label>
                <p className="text-white text-sm font-mono mt-1">{wallet._id}</p>
              </div>
              <div>
                <Label className="text-gray-400">Owner</Label>
                <p className="text-white text-sm mt-1">
                  {wallet.owner?.firstName} {wallet.owner?.lastName}
                </p>
                <p className="text-gray-500 text-xs">{wallet.owner?.email}</p>
              </div>
              <div>
                <Label className="text-gray-400">Type</Label>
                <p className="text-white text-sm mt-1">{wallet.ownerModel}</p>
              </div>
              <div>
                <Label className="text-gray-400">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${wallet.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {wallet.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {wallet.isFrozen && (
                    <span className="text-red-400 text-sm">(Frozen)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Balance Overview */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Balance Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <Label className="text-gray-400">Total Balance</Label>
                <p className="text-white text-xl font-bold mt-1">
                  ₹{wallet.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-green-900/20 p-4 rounded-lg">
                <Label className="text-green-400">Available Balance</Label>
                <p className="text-green-400 text-xl font-bold mt-1">
                  ₹{wallet.availableBalance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-yellow-900/20 p-4 rounded-lg">
                <Label className="text-yellow-400">Hold Amount</Label>
                <p className="text-yellow-400 text-xl font-bold mt-1">
                  ₹{wallet.holdAmount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-gray-400">Lifetime Earnings</Label>
                <p className="text-white text-lg mt-1">
                  ₹{wallet.lifetimeEarnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Total Withdrawn</Label>
                <p className="text-white text-lg mt-1">
                  ₹{wallet.totalWithdrawn?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Admin Actions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>

            {/* Credit Wallet */}
            <div className="mb-4">
              <Label className="text-gray-300">Credit Wallet</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black"
                />
                <Input
                  placeholder="Description (optional)"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black"
                />
                <Button
                  onClick={handleCredit}
                  disabled={creditLoading || !creditAmount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creditLoading ? '...' : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Debit Wallet */}
            <div className="mb-4">
              <Label className="text-gray-300">Debit Wallet</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={debitAmount}
                  onChange={(e) => setDebitAmount(e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black"
                />
                <Input
                  placeholder="Description (optional)"
                  value={debitDescription}
                  onChange={(e) => setDebitDescription(e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black"
                />
                <Button
                  onClick={handleDebit}
                  disabled={debitLoading || !debitAmount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {debitLoading ? '...' : <Minus className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Freeze/Unfreeze */}
            <div className="mb-4">
              <Label className="text-gray-300">Wallet Control</Label>
              <div className="flex gap-2 mt-2">
                {wallet.isFrozen ? (
                  <Button
                    onClick={handleUnfreeze}
                    disabled={unfreezeLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {unfreezeLoading ? '...' : <><Eye className="w-4 h-4 mr-2" /> Unfreeze</>}
                  </Button>
                ) : (
                  <>
                    <Input
                      placeholder="Freeze reason"
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black"
                    />
                    <Button
                      onClick={handleFreeze}
                      disabled={freezeLoading || !freezeReason}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {freezeLoading ? '...' : <><EyeOff className="w-4 h-4 mr-2" /> Freeze</>}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* View Transactions */}
            <Button
              onClick={handleViewTransactions}
              disabled={transactionsLoading}
              variant="outline"
              className="w-full"
            >
              {transactionsLoading ? '...' : <><TrendingUp className="w-4 h-4 mr-2" /> View Transactions</>}
            </Button>
          </div>

          {/* Recent Transactions */}
          {transactions && transactions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction._id} className="bg-gray-900/30 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white text-sm">{transaction.description}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toFixed(2)}
                          </p>
                          <p className="text-gray-500 text-xs">{transaction.source}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}