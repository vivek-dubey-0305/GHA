import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListWallet } from '../../components/wallet/ListWallet';
import { EditWallet } from '../../components/wallet/EditWallet';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllWallets,
  selectWallets,
  selectWalletsLoading,
  selectWalletsError,
  selectWalletsPagination,
  selectUpdateWalletSuccess,
  clearWalletError,
} from '../../redux/slices/wallet.slice.js';

export default function Wallets() {
  const dispatch = useDispatch();
  const wallets = useSelector(selectWallets);
  const walletsLoading = useSelector(selectWalletsLoading);
  const walletsError = useSelector(selectWalletsError);
  const pagination = useSelector(selectWalletsPagination);
  const updateWalletSuccess = useSelector(selectUpdateWalletSuccess);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllWallets({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updateWalletSuccess) {
      toast.success('Wallet updated successfully!');
      dispatch(clearWalletError());
      dispatch(getAllWallets({ page: currentPage }));
    }
  }, [updateWalletSuccess, toast, dispatch, currentPage]);

  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
  };

  const handleCloseRightSidebar = () => {
    setSelectedWallet(null);
  };

  const handleSaveWallet = (updatedWallet) => {
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
          <ListWallet
            wallets={wallets}
            pagination={pagination}
            onWalletClick={handleWalletClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedWallet && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedWallet && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditWallet
                wallet={selectedWallet}
                onClose={handleCloseRightSidebar}
                onSave={handleSaveWallet}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}