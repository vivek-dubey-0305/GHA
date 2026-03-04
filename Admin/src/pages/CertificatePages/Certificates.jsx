import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListCertificate } from '../../components/certificate/ListCertificate';
import { EditCertificate } from '../../components/certificate/EditCertificate';
import { AddCertificate } from '../../components/certificate/AddCertificate';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllCertificates,
  selectCertificates,
  selectCertificatesLoading,
  selectCertificatesError,
  selectCertificatePagination,
  selectCreateCertificateSuccess,
  selectUpdateCertificateSuccess,
  selectDeleteCertificateSuccess,
  resetCreateCertificateState,
  resetUpdateCertificateState,
  resetDeleteCertificateState,
} from '../../redux/slices/certificate.slice.js';

export default function Certificates() {
  const dispatch = useDispatch();
  const certificates = useSelector(selectCertificates);
  const certificatesLoading = useSelector(selectCertificatesLoading);
  const certificatesError = useSelector(selectCertificatesError);
  const pagination = useSelector(selectCertificatePagination);
  const createCertificateSuccess = useSelector(selectCreateCertificateSuccess);
  const updateCertificateSuccess = useSelector(selectUpdateCertificateSuccess);
  const deleteCertificateSuccess = useSelector(selectDeleteCertificateSuccess);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showAddCertificate, setShowAddCertificate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllCertificates({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createCertificateSuccess) {
      toast.success('Certificate added successfully!');
      dispatch(resetCreateCertificateState());
      dispatch(getAllCertificates({ page: currentPage }));
    }
  }, [createCertificateSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateCertificateSuccess) {
      toast.success('Certificate updated successfully!');
      dispatch(resetUpdateCertificateState());
      dispatch(getAllCertificates({ page: currentPage }));
    }
  }, [updateCertificateSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteCertificateSuccess) {
      toast.success('Certificate deleted successfully!');
      dispatch(resetDeleteCertificateState());
      dispatch(getAllCertificates({ page: currentPage }));
    }
  }, [deleteCertificateSuccess, toast, dispatch, currentPage]);

  const handleCertificateClick = (certificate) => {
    setSelectedCertificate(certificate);
    setShowAddCertificate(false);
  };

  const handleAddCertificateClick = () => {
    setShowAddCertificate(true);
    setSelectedCertificate(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedCertificate(null);
    setShowAddCertificate(false);
  };

  const handleSaveCertificate = (updatedCertificate) => {
    handleCloseRightSidebar();
  };

  const handleAddCertificate = () => {
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
          <div className="p-8 pb-0 flex items-center justify-between">
            <div />
            <Button
              onClick={handleAddCertificateClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </Button>
          </div>

          <ListCertificate
            certificates={certificates}
            pagination={pagination}
            onCertificateClick={handleCertificateClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedCertificate || showAddCertificate) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedCertificate || showAddCertificate) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddCertificate ? (
                <AddCertificate
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddCertificate}
                />
              ) : (
                <EditCertificate
                  certificate={selectedCertificate}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveCertificate}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
