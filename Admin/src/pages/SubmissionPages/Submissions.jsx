import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListSubmission } from '../../components/submission/ListSubmission';
import { EditSubmission } from '../../components/submission/EditSubmission';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllSubmissions,
  selectSubmissions,
  selectSubmissionsLoading,
  selectSubmissionsError,
  selectSubmissionPagination,
  selectUpdateSubmissionSuccess,
  selectDeleteSubmissionSuccess,
  resetUpdateSubmissionState,
  resetDeleteSubmissionState,
} from '../../redux/slices/submission.slice.js';

export default function Submissions() {
  const dispatch = useDispatch();
  const submissions = useSelector(selectSubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const submissionsError = useSelector(selectSubmissionsError);
  const pagination = useSelector(selectSubmissionPagination);
  const updateSubmissionSuccess = useSelector(selectUpdateSubmissionSuccess);
  const deleteSubmissionSuccess = useSelector(selectDeleteSubmissionSuccess);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllSubmissions({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updateSubmissionSuccess) {
      toast.success('Submission updated successfully!');
      dispatch(resetUpdateSubmissionState());
      dispatch(getAllSubmissions({ page: currentPage }));
    }
  }, [updateSubmissionSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteSubmissionSuccess) {
      toast.success('Submission deleted successfully!');
      dispatch(resetDeleteSubmissionState());
      dispatch(getAllSubmissions({ page: currentPage }));
    }
  }, [deleteSubmissionSuccess, toast, dispatch, currentPage]);

  const handleSubmissionClick = (submission) => {
    setSelectedSubmission(submission);
  };

  const handleCloseRightSidebar = () => {
    setSelectedSubmission(null);
  };

  const handleSaveSubmission = (updatedSubmission) => {
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
          <ListSubmission
            submissions={submissions}
            pagination={pagination}
            onSubmissionClick={handleSubmissionClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedSubmission && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditSubmission
                submission={selectedSubmission}
                onClose={handleCloseRightSidebar}
                onSave={handleSaveSubmission}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
