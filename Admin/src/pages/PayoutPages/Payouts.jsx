import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListPayout } from '../../components/payout/ListPayout';
import { EditPayout } from '../../components/payout/EditPayout';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllPayouts,
  selectPayouts,
  selectPayoutsLoading,
  selectPayoutsError,
  selectPayoutsPagination,
  selectUpdatePayoutSuccess,
  clearPayoutError,
} from '../../redux/slices/payout.slice.js';

export default function Payouts() {
  const dispatch = useDispatch();
  const payouts = useSelector(selectPayouts);
  const payoutsLoading = useSelector(selectPayoutsLoading);
  const payoutsError = useSelector(selectPayoutsError);
  const pagination = useSelector(selectPayoutsPagination);
  const updatePayoutSuccess = useSelector(selectUpdatePayoutSuccess);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllPayouts({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updatePayoutSuccess) {
      toast.success('Payout updated successfully!');
      dispatch(clearPayoutError());
      dispatch(getAllPayouts({ page: currentPage }));
    }
  }, [updatePayoutSuccess, toast, dispatch, currentPage]);

  const handlePayoutClick = (payout) => {
    setSelectedPayout(payout);
  };

  const handleCloseRightSidebar = () => {
    setSelectedPayout(null);
  };

  const handleSavePayout = (updatedPayout) => {
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
          <ListPayout
            payouts={payouts}
            pagination={pagination}
            onPayoutClick={handlePayoutClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedPayout && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedPayout && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditPayout
                payout={selectedPayout}
                onClose={handleCloseRightSidebar}
                onSave={handleSavePayout}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}