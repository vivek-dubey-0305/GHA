import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListPayment } from '../../components/payment/ListPayment';
import { EditPayment } from '../../components/payment/EditPayment';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllPayments,
  selectPayments,
  selectPaymentsLoading,
  selectPaymentsError,
  selectPaymentPagination,
  selectUpdatePaymentSuccess,
  selectDeletePaymentSuccess,
  resetUpdatePaymentState,
  resetDeletePaymentState,
} from '../../redux/slices/payment.slice.js';

export default function Payments() {
  const dispatch = useDispatch();
  const payments = useSelector(selectPayments);
  const paymentsLoading = useSelector(selectPaymentsLoading);
  const paymentsError = useSelector(selectPaymentsError);
  const pagination = useSelector(selectPaymentPagination);
  const updatePaymentSuccess = useSelector(selectUpdatePaymentSuccess);
  const deletePaymentSuccess = useSelector(selectDeletePaymentSuccess);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllPayments({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updatePaymentSuccess) {
      toast.success('Payment updated successfully!');
      dispatch(resetUpdatePaymentState());
      dispatch(getAllPayments({ page: currentPage }));
    }
  }, [updatePaymentSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deletePaymentSuccess) {
      toast.success('Payment deleted successfully!');
      dispatch(resetDeletePaymentState());
      dispatch(getAllPayments({ page: currentPage }));
    }
  }, [deletePaymentSuccess, toast, dispatch, currentPage]);

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
  };

  const handleCloseRightSidebar = () => {
    setSelectedPayment(null);
  };

  const handleSavePayment = (updatedPayment) => {
    handleCloseRightSidebar();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="flex h-full relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <ListPayment
            payments={payments}
            pagination={pagination}
            onPaymentClick={handlePaymentClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedPayment && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedPayment && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditPayment
                payment={selectedPayment}
                onClose={handleCloseRightSidebar}
                onSave={handleSavePayment}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
