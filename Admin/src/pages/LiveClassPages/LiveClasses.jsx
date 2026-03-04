import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListLiveClass } from '../../components/liveclass/ListLiveClass';
import { EditLiveClass } from '../../components/liveclass/EditLiveClass';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllLiveClasses,
  selectLiveClasses,
  selectLiveClassesLoading,
  selectLiveClassesError,
  selectLiveClassPagination,
  selectUpdateLiveClassSuccess,
  selectDeleteLiveClassSuccess,
  resetUpdateLiveClassState,
  resetDeleteLiveClassState,
} from '../../redux/slices/liveclass.slice.js';

export default function LiveClasses() {
  const dispatch = useDispatch();
  const liveClasses = useSelector(selectLiveClasses);
  const liveClassesLoading = useSelector(selectLiveClassesLoading);
  const liveClassesError = useSelector(selectLiveClassesError);
  const pagination = useSelector(selectLiveClassPagination);
  const updateLiveClassSuccess = useSelector(selectUpdateLiveClassSuccess);
  const deleteLiveClassSuccess = useSelector(selectDeleteLiveClassSuccess);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllLiveClasses({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updateLiveClassSuccess) {
      toast.success('Live class updated successfully!');
      dispatch(resetUpdateLiveClassState());
      dispatch(getAllLiveClasses({ page: currentPage }));
    }
  }, [updateLiveClassSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteLiveClassSuccess) {
      toast.success('Live class deleted successfully!');
      dispatch(resetDeleteLiveClassState());
      dispatch(getAllLiveClasses({ page: currentPage }));
    }
  }, [deleteLiveClassSuccess, toast, dispatch, currentPage]);

  const handleLiveClassClick = (liveClass) => {
    setSelectedLiveClass(liveClass);
  };

  const handleCloseRightSidebar = () => {
    setSelectedLiveClass(null);
  };

  const handleSaveLiveClass = (updatedLiveClass) => {
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
          <ListLiveClass
            liveClasses={liveClasses}
            pagination={pagination}
            onLiveClassClick={handleLiveClassClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedLiveClass && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedLiveClass && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditLiveClass
                liveClass={selectedLiveClass}
                onClose={handleCloseRightSidebar}
                onSave={handleSaveLiveClass}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
