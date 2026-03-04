import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListProgress } from '../../components/progress/ListProgress';
import { EditProgress } from '../../components/progress/EditProgress';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllProgress,
  deleteProgress,
  selectProgress,
  selectProgressLoading,
  selectProgressError,
  selectProgressPagination,
  selectDeleteProgressSuccess,
  resetDeleteProgressState,
} from '../../redux/slices/progress.slice.js';


export default function Progress() {
  const dispatch = useDispatch();
  const progressRecords = useSelector(selectProgress);
  const progressLoading = useSelector(selectProgressLoading);
  const progressError = useSelector(selectProgressError);
  const pagination = useSelector(selectProgressPagination);
  const deleteProgressSuccess = useSelector(selectDeleteProgressSuccess);
  const [view, setView] = useState('list');
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllProgress({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (deleteProgressSuccess) {
      toast.success('Progress record deleted successfully!');
      dispatch(resetDeleteProgressState());
      dispatch(getAllProgress({ page: currentPage }));
      if (view === 'edit') {
        setView('list');
        setSelectedProgress(null);
      }
    }
  }, [deleteProgressSuccess, toast, dispatch, currentPage, view]);

  const handleEdit = (record) => {
    setSelectedProgress(record);
    setView('edit');
  };

  const handleDelete = async (progressId) => {
    try {
      await dispatch(deleteProgress(progressId)).unwrap();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete progress');
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedProgress(null);
    dispatch(getAllProgress({ page: currentPage }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col">
          {view === 'list' && (
            <ListProgress
              progressRecords={progressRecords}
              pagination={pagination}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPageChange={handlePageChange}
            />
          )}

          {view === 'edit' && selectedProgress && (
            <EditProgress
              progressRecord={selectedProgress}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
