import { X, Save, CheckCircle, XCircle, AlertTriangle, Flag } from 'lucide-react';
import { Button, Input, Label, Separator, Textarea } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

export function EditPayout({ payout, onClose, onSave }) {
  const dispatch = useDispatch();
  const processLoading = useSelector(selectProcessPayoutLoading);
  const completeLoading = useSelector(selectCompletePayoutLoading);
  const failLoading = useSelector(selectFailPayoutLoading);
  const cancelLoading = useSelector(selectAdminCancelPayoutLoading);
  const flagLoading = useSelector(selectFlagPayoutLoading);
  const reviewLoading = useSelector(selectReviewPayoutLoading);

  const [utr, setUtr] = useState('');
  const [gatewayPayoutId, setGatewayPayoutId] = useState('');
  const [notes, setNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [failureCode, setFailureCode] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewApprove, setReviewApprove] = useState(false);

  if (!payout) return null;

  const handleProcess = async () => {
    try {
      await dispatch(processPayout(payout._id)).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to process payout:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await dispatch(completePayout({
        payoutId: payout._id,
        utr: utr || `UTR${Date.now()}`,
        gatewayPayoutId: gatewayPayoutId || `PAY${Date.now()}`,
        notes: notes || 'Completed by admin',
      })).unwrap();
      setUtr('');
      setGatewayPayoutId('');
      setNotes('');
      onSave();
    } catch (error) {
      console.error('Failed to complete payout:', error);
    }
  };

  const handleFail = async () => {
    try {
      await dispatch(failPayout({
        payoutId: payout._id,
        reason: failureReason || 'Failed by admin',
        failureCode: failureCode || 'ADMIN_FAIL',
      })).unwrap();
      setFailureReason('');
      setFailureCode('');
      onSave();
    } catch (error) {
      console.error('Failed to fail payout:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await dispatch(adminCancelPayout({
        payoutId: payout._id,
        reason: cancelReason || 'Cancelled by admin',
      })).unwrap();
      setCancelReason('');
      onSave();
    } catch (error) {
      console.error('Failed to cancel payout:', error);
    }
  };

  const handleFlag = async () => {
    try {
      await dispatch(flagPayout({
        payoutId: payout._id,
        reason: flagReason || 'Flagged by admin',
      })).unwrap();
      setFlagReason('');
      onSave();
    } catch (error) {
      console.error('Failed to flag payout:', error);
    }
  };

  const handleReview = async () => {
    try {
      await dispatch(reviewPayout({
        payoutId: payout._id,
        approve: reviewApprove,
        notes: reviewNotes || 'Reviewed by admin',
      })).unwrap();
      setReviewNotes('');
      onSave();
    } catch (error) {
      console.error('Failed to review payout:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Payout</h2>
          <p className="text-sm text-gray-400 mt-1">Manage payout request</p>
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
          {/* Payout Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payout Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Payout ID</Label>
                <p className="text-white text-sm font-mono mt-1">{payout._id}</p>
              </div>
              <div>
                <Label className="text-gray-400">Owner</Label>
                <p className="text-white text-sm mt-1">
                  {payout.owner?.firstName} {payout.owner?.lastName}
                </p>
                <p className="text-gray-500 text-xs">{payout.owner?.email}</p>
              </div>
              <div>
                <Label className="text-gray-400">Amount</Label>
                <p className="text-white text-lg font-bold mt-1">
                  ₹{payout.amount?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Method</Label>
                <p className="text-white text-sm mt-1">
                  {payout.method === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Status</Label>
                <p className={`text-sm mt-1 ${
                  payout.status === 'completed' ? 'text-green-400' :
                  payout.status === 'failed' ? 'text-red-400' :
                  payout.status === 'processing' ? 'text-blue-400' :
                  payout.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {payout.status?.charAt(0).toUpperCase() + payout.status?.slice(1)}
                  {payout.risk?.isFlagged && ' (Flagged)'}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Requested</Label>
                <p className="text-white text-sm mt-1">
                  {payout.createdAt ? new Date(payout.createdAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Bank/UPI Details */}
          {payout.method === 'bank_transfer' && payout.bankDetails && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Account Holder</Label>
                    <p className="text-white text-sm mt-1">{payout.bankDetails.accountHolderName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Account Number</Label>
                    <p className="text-white text-sm font-mono mt-1">{payout.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">IFSC Code</Label>
                    <p className="text-white text-sm font-mono mt-1">{payout.bankDetails.ifscCode}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Bank Name</Label>
                    <p className="text-white text-sm mt-1">{payout.bankDetails.bankName || '—'}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {payout.method === 'upi' && payout.upiId && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">UPI Details</h3>
                <div>
                  <Label className="text-gray-400">UPI ID</Label>
                  <p className="text-white text-sm font-mono mt-1">{payout.upiId}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Admin Actions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>

            {/* Process Payout */}
            {payout.status === 'pending' && (
              <div className="mb-4">
                <Button
                  onClick={handleProcess}
                  disabled={processLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {processLoading ? 'Processing...' : 'Start Processing'}
                </Button>
              </div>
            )}

            {/* Complete Payout */}
            {payout.status === 'processing' && (
              <div className="mb-4 space-y-4">
                <div>
                  <Label className="text-gray-300">UTR/Reference Number</Label>
                  <Input
                    placeholder="Enter UTR or reference number"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Gateway Payout ID</Label>
                  <Input
                    placeholder="Enter gateway payout ID"
                    value={gatewayPayoutId}
                    onChange={(e) => setGatewayPayoutId(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Notes</Label>
                  <Textarea
                    placeholder="Completion notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={completeLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {completeLoading ? 'Completing...' : <><CheckCircle className="w-4 h-4 mr-2" /> Complete Payout</>}
                </Button>
              </div>
            )}

            {/* Fail Payout */}
            {(payout.status === 'pending' || payout.status === 'processing') && (
              <div className="mb-4 space-y-4">
                <div>
                  <Label className="text-gray-300">Failure Reason</Label>
                  <Textarea
                    placeholder="Reason for failure"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Failure Code</Label>
                  <Input
                    placeholder="Failure code"
                    value={failureCode}
                    onChange={(e) => setFailureCode(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <Button
                  onClick={handleFail}
                  disabled={failLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {failLoading ? 'Failing...' : <><XCircle className="w-4 h-4 mr-2" /> Fail Payout</>}
                </Button>
              </div>
            )}

            {/* Cancel Payout */}
            {(payout.status === 'pending' || payout.status === 'processing') && (
              <div className="mb-4 space-y-4">
                <div>
                  <Label className="text-gray-300">Cancellation Reason</Label>
                  <Textarea
                    placeholder="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <Button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Payout'}
                </Button>
              </div>
            )}

            {/* Flag Payout */}
            {!payout.risk?.isFlagged && payout.status !== 'completed' && payout.status !== 'failed' && payout.status !== 'cancelled' && (
              <div className="mb-4 space-y-4">
                <div>
                  <Label className="text-gray-300">Flag Reason</Label>
                  <Textarea
                    placeholder="Reason for flagging"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <Button
                  onClick={handleFlag}
                  disabled={flagLoading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {flagLoading ? 'Flagging...' : <><Flag className="w-4 h-4 mr-2" /> Flag for Review</>}
                </Button>
              </div>
            )}

            {/* Review Flagged Payout */}
            {payout.risk?.isFlagged && payout.status !== 'completed' && payout.status !== 'failed' && payout.status !== 'cancelled' && (
              <div className="mb-4 space-y-4">
                <div>
                  <Label className="text-gray-300">Review Decision</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="review"
                        checked={reviewApprove}
                        onChange={() => setReviewApprove(true)}
                        className="mr-2"
                      />
                      <span className="text-green-400">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="review"
                        checked={!reviewApprove}
                        onChange={() => setReviewApprove(false)}
                        className="mr-2"
                      />
                      <span className="text-red-400">Reject</span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Review Notes</Label>
                  <Textarea
                    placeholder="Review notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <Button
                  onClick={handleReview}
                  disabled={reviewLoading}
                  className={`w-full ${reviewApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {reviewLoading ? 'Reviewing...' : <><AlertTriangle className="w-4 h-4 mr-2" /> Submit Review</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}