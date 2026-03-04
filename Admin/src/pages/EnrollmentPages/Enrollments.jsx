import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListEnrollment } from '../../components/enrollment/ListEnrollment';
import { EditEnrollment } from '../../components/enrollment/EditEnrollment';
import { AddEnrollment } from '../../components/enrollment/AddEnrollment';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllEnrollments,
  selectEnrollments,
  selectEnrollmentsLoading,
  selectEnrollmentsError,
  selectEnrollmentPagination,
  selectCreateEnrollmentSuccess,
  selectUpdateEnrollmentSuccess,
  selectDeleteEnrollmentSuccess,
  resetCreateEnrollmentState,
  resetUpdateEnrollmentState,
  resetDeleteEnrollmentState,
} from '../../redux/slices/enrollment.slice.js';

export default function Enrollments() {
  const dispatch = useDispatch();
  const enrollments = useSelector(selectEnrollments);
  const enrollmentsLoading = useSelector(selectEnrollmentsLoading);
  const enrollmentsError = useSelector(selectEnrollmentsError);
  const pagination = useSelector(selectEnrollmentPagination);
  const createEnrollmentSuccess = useSelector(selectCreateEnrollmentSuccess);
  const updateEnrollmentSuccess = useSelector(selectUpdateEnrollmentSuccess);
  const deleteEnrollmentSuccess = useSelector(selectDeleteEnrollmentSuccess);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showAddEnrollment, setShowAddEnrollment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllEnrollments({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createEnrollmentSuccess) {
      toast.success('Enrollment added successfully!');
      dispatch(resetCreateEnrollmentState());
      dispatch(getAllEnrollments({ page: currentPage }));
    }
  }, [createEnrollmentSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateEnrollmentSuccess) {
      toast.success('Enrollment updated successfully!');
      dispatch(resetUpdateEnrollmentState());
      dispatch(getAllEnrollments({ page: currentPage }));
    }
  }, [updateEnrollmentSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteEnrollmentSuccess) {
      toast.success('Enrollment deleted successfully!');
      dispatch(resetDeleteEnrollmentState());
      dispatch(getAllEnrollments({ page: currentPage }));
    }
  }, [deleteEnrollmentSuccess, toast, dispatch, currentPage]);

  const handleEnrollmentClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowAddEnrollment(false);
  };

  const handleAddEnrollmentClick = () => {
    setShowAddEnrollment(true);
    setSelectedEnrollment(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedEnrollment(null);
    setShowAddEnrollment(false);
  };

  const handleSaveEnrollment = (updatedEnrollment) => {
    handleCloseRightSidebar();
  };

  const handleAddEnrollment = () => {
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
              onClick={handleAddEnrollmentClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Enrollment
            </Button>
          </div>

          <ListEnrollment
            enrollments={enrollments}
            pagination={pagination}
            onEnrollmentClick={handleEnrollmentClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedEnrollment || showAddEnrollment) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedEnrollment || showAddEnrollment) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddEnrollment ? (
                <AddEnrollment
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddEnrollment}
                />
              ) : (
                <EditEnrollment
                  enrollment={selectedEnrollment}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveEnrollment}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
