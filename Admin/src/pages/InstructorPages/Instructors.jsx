import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListInstructor } from '../../components/instructor/ListInstructor';
import { EditInstructor } from '../../components/instructor/EditInstructor';
import { AddInstructor } from '../../components/instructor/AddInstructor';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllInstructors,
  selectInstructors,
  selectInstructorsLoading,
  selectInstructorsError,
  selectInstructorPagination,
  selectCreateInstructorSuccess,
  selectUpdateInstructorSuccess,
  selectDeleteInstructorSuccess,
  resetCreateInstructorState,
  resetUpdateInstructorState,
  resetDeleteInstructorState,
} from '../../redux/slices/instructor.slice.js';

export default function Instructors() {
  const dispatch = useDispatch();
  const instructors = useSelector(selectInstructors);
  const instructorsLoading = useSelector(selectInstructorsLoading);
  const instructorsError = useSelector(selectInstructorsError);
  const pagination = useSelector(selectInstructorPagination);
  const createInstructorSuccess = useSelector(selectCreateInstructorSuccess);
  const updateInstructorSuccess = useSelector(selectUpdateInstructorSuccess);
  const deleteInstructorSuccess = useSelector(selectDeleteInstructorSuccess);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showAddInstructor, setShowAddInstructor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllInstructors({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createInstructorSuccess) {
      toast.success('Instructor added successfully!');
      dispatch(resetCreateInstructorState());
      dispatch(getAllInstructors({ page: currentPage }));
    }
  }, [createInstructorSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateInstructorSuccess) {
      toast.success('Instructor updated successfully!');
      dispatch(resetUpdateInstructorState());
      dispatch(getAllInstructors({ page: currentPage }));
    }
  }, [updateInstructorSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteInstructorSuccess) {
      toast.success('Instructor deleted successfully!');
      dispatch(resetDeleteInstructorState());
      dispatch(getAllInstructors({ page: currentPage }));
    }
  }, [deleteInstructorSuccess, toast, dispatch, currentPage]);

  const handleInstructorClick = (instructor) => {
    setSelectedInstructor(instructor);
    setShowAddInstructor(false);
  };

  const handleAddInstructorClick = () => {
    setShowAddInstructor(true);
    setSelectedInstructor(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedInstructor(null);
    setShowAddInstructor(false);
  };

  const handleSaveInstructor = (updatedInstructor) => {
    // Update handled via Redux thunk in EditInstructor
    handleCloseRightSidebar();
  };

  const handleAddInstructor = () => {
    // Create handled via Redux thunk in AddInstructor
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
              onClick={handleAddInstructorClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instructor
            </Button>
          </div>

          <ListInstructor
            instructors={instructors}
            pagination={pagination}
            onInstructorClick={handleInstructorClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedInstructor || showAddInstructor) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedInstructor || showAddInstructor) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddInstructor ? (
                <AddInstructor
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddInstructor}
                />
              ) : (
                <EditInstructor
                  instructor={selectedInstructor}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveInstructor}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
