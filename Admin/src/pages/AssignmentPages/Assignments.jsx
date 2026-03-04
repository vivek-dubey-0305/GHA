import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListAssignment } from '../../components/assignment/ListAssignment';
import { EditAssignment } from '../../components/assignment/EditAssignment';
import { AddAssignment } from '../../components/assignment/AddAssignment';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllAssignments,
  selectAssignments,
  selectAssignmentsLoading,
  selectAssignmentsError,
  selectAssignmentPagination,
  selectCreateAssignmentSuccess,
  selectUpdateAssignmentSuccess,
  selectDeleteAssignmentSuccess,
  resetCreateAssignmentState,
  resetUpdateAssignmentState,
  resetDeleteAssignmentState,
} from '../../redux/slices/assignment.slice.js';

export default function Assignments() {
  const dispatch = useDispatch();
  const assignments = useSelector(selectAssignments);
  const assignmentsLoading = useSelector(selectAssignmentsLoading);
  const assignmentsError = useSelector(selectAssignmentsError);
  const pagination = useSelector(selectAssignmentPagination);
  const createAssignmentSuccess = useSelector(selectCreateAssignmentSuccess);
  const updateAssignmentSuccess = useSelector(selectUpdateAssignmentSuccess);
  const deleteAssignmentSuccess = useSelector(selectDeleteAssignmentSuccess);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllAssignments({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createAssignmentSuccess) {
      toast.success('Assignment added successfully!');
      dispatch(resetCreateAssignmentState());
      dispatch(getAllAssignments({ page: currentPage }));
    }
  }, [createAssignmentSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateAssignmentSuccess) {
      toast.success('Assignment updated successfully!');
      dispatch(resetUpdateAssignmentState());
      dispatch(getAllAssignments({ page: currentPage }));
    }
  }, [updateAssignmentSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteAssignmentSuccess) {
      toast.success('Assignment deleted successfully!');
      dispatch(resetDeleteAssignmentState());
      dispatch(getAllAssignments({ page: currentPage }));
    }
  }, [deleteAssignmentSuccess, toast, dispatch, currentPage]);

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowAddAssignment(false);
  };

  const handleAddAssignmentClick = () => {
    setShowAddAssignment(true);
    setSelectedAssignment(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedAssignment(null);
    setShowAddAssignment(false);
  };

  const handleSaveAssignment = (updatedAssignment) => {
    handleCloseRightSidebar();
  };

  const handleAddAssignment = () => {
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
              onClick={handleAddAssignmentClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          </div>

          <ListAssignment
            assignments={assignments}
            pagination={pagination}
            onAssignmentClick={handleAssignmentClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedAssignment || showAddAssignment) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedAssignment || showAddAssignment) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddAssignment ? (
                <AddAssignment
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddAssignment}
                />
              ) : (
                <EditAssignment
                  assignment={selectedAssignment}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveAssignment}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
