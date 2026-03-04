import { X, Save, Trash2, RotateCcw } from 'lucide-react';
import { Button, Input, Label, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updatePayment,
  deletePayment,
  adminProcessRefund,
  selectUpdatePaymentLoading,
  selectUpdatePaymentError,
  selectDeletePaymentLoading,
  selectRefundLoading,
} from '../../redux/slices/payment.slice.js';


export function EditPayment({ payment, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updatePaymentLoading = useSelector(selectUpdatePaymentLoading);
  const updatePaymentError = useSelector(selectUpdatePaymentError);
  const deletePaymentLoading = useSelector(selectDeletePaymentLoading);
  const refundLoading = useSelector(selectRefundLoading);

  const [editedPayment, setEditedPayment] = useState({
    _id: payment?._id,
    userId: payment?.userId || '',
    courseId: payment?.courseId || '',
    amount: payment?.amount || 0,
    paymentMethod: payment?.paymentMethod || '',
    status: payment?.status || 'pending',
    createdAt: payment?.createdAt,
    updatedAt: payment?.updatedAt,
  });

  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!payment) return null;

  const handleChange = (field, value) => {
    setEditedPayment(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updatePayment({
        paymentId: editedPayment._id,
        paymentData: { status: editedPayment.status },
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update payment:', error);
    }
  };

  const handleProcessRefund = async () => {
    try {
      await dispatch(adminProcessRefund({
        paymentId: editedPayment._id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
      })).unwrap();
      setRefundAmount('');
      setRefundReason('');
      onSave();
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deletePayment(editedPayment._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Payment</h2>
          <p className="text-sm text-gray-400 mt-1">Manage payment details and refunds</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updatePaymentError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updatePaymentError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Payment Information (Read-only) */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Transaction ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedPayment._id}</p>
              </div>
              <div>
                <Label className="text-gray-400">User ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedPayment.userId}</p>
              </div>
              <div>
                <Label className="text-gray-400">Course ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedPayment.courseId}</p>
              </div>
              <div>
                <Label className="text-gray-400">Amount</Label>
                <p className="text-gray-300 mt-1 text-sm">{editedPayment.amount}</p>
              </div>
              <div>
                <Label className="text-gray-400">Payment Method</Label>
                <p className="text-gray-300 mt-1 text-sm">{editedPayment.paymentMethod}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Editable Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Payment Status</Label>
                <select
                  id="status"
                  value={editedPayment.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-gray-600 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Process Refund */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Process Refund</h3>
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-4">
              <div>
                <Label htmlFor="refundAmount" className="text-gray-300">Refund Amount</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  placeholder="Enter refund amount"
                />
              </div>
              <div>
                <Label htmlFor="refundReason" className="text-gray-300">Reason</Label>
                <textarea
                  id="refundReason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-gray-600 transition-colors min-h-[80px] resize-y"
                  placeholder="Reason for refund"
                />
              </div>
              <Button
                onClick={handleProcessRefund}
                disabled={refundLoading || !refundAmount || !refundReason}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {refundLoading ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedPayment.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedPayment.createdAt).toLocaleString()}</p>
                </div>
                {editedPayment.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedPayment.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="bg-gray-800" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Payment</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this payment record</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deletePaymentLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deletePaymentLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updatePaymentLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updatePaymentLoading ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Delete Warning Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Payment"
        message={`Are you sure you want to delete payment "${editedPayment._id}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
