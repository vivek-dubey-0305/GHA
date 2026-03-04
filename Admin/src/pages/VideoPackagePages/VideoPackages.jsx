import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListVideoPackage } from '../../components/videopackage/ListVideoPackage';
import { EditVideoPackage } from '../../components/videopackage/EditVideoPackage';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllVideoPackages,
  selectVideoPackages,
  selectVideoPackagesLoading,
  selectVideoPackagesError,
  selectVideoPackagePagination,
  selectUpdateVideoPackageSuccess,
  selectDeleteVideoPackageSuccess,
  resetUpdateVideoPackageState,
  resetDeleteVideoPackageState,
} from '../../redux/slices/videopackage.slice.js';

export default function VideoPackages() {
  const dispatch = useDispatch();
  const videoPackages = useSelector(selectVideoPackages);
  const videoPackagesLoading = useSelector(selectVideoPackagesLoading);
  const videoPackagesError = useSelector(selectVideoPackagesError);
  const pagination = useSelector(selectVideoPackagePagination);
  const updateVideoPackageSuccess = useSelector(selectUpdateVideoPackageSuccess);
  const deleteVideoPackageSuccess = useSelector(selectDeleteVideoPackageSuccess);
  const [selectedVideoPackage, setSelectedVideoPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllVideoPackages({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updateVideoPackageSuccess) {
      toast.success('Video package updated successfully!');
      dispatch(resetUpdateVideoPackageState());
      dispatch(getAllVideoPackages({ page: currentPage }));
    }
  }, [updateVideoPackageSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteVideoPackageSuccess) {
      toast.success('Video package deleted successfully!');
      dispatch(resetDeleteVideoPackageState());
      dispatch(getAllVideoPackages({ page: currentPage }));
    }
  }, [deleteVideoPackageSuccess, toast, dispatch, currentPage]);

  const handleVideoPackageClick = (videoPackage) => {
    setSelectedVideoPackage(videoPackage);
  };

  const handleCloseRightSidebar = () => {
    setSelectedVideoPackage(null);
  };

  const handleSaveVideoPackage = (updatedVideoPackage) => {
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
          <ListVideoPackage
            videoPackages={videoPackages}
            pagination={pagination}
            onVideoPackageClick={handleVideoPackageClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedVideoPackage && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedVideoPackage && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditVideoPackage
                videoPackage={selectedVideoPackage}
                onClose={handleCloseRightSidebar}
                onSave={handleSaveVideoPackage}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
