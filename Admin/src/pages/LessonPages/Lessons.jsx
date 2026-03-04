import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListLesson } from '../../components/lesson/ListLesson';
import { EditLesson } from '../../components/lesson/EditLesson';
import { AddLesson } from '../../components/lesson/AddLesson';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllLessons,
  selectLessons,
  selectLessonsLoading,
  selectLessonsError,
  selectLessonPagination,
  selectCreateLessonSuccess,
  selectUpdateLessonSuccess,
  selectDeleteLessonSuccess,
  resetCreateLessonState,
  resetUpdateLessonState,
  resetDeleteLessonState,
} from '../../redux/slices/lesson.slice.js';

export default function Lessons() {
  const dispatch = useDispatch();
  const lessons = useSelector(selectLessons);
  const lessonsLoading = useSelector(selectLessonsLoading);
  const lessonsError = useSelector(selectLessonsError);
  const pagination = useSelector(selectLessonPagination);
  const createLessonSuccess = useSelector(selectCreateLessonSuccess);
  const updateLessonSuccess = useSelector(selectUpdateLessonSuccess);
  const deleteLessonSuccess = useSelector(selectDeleteLessonSuccess);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllLessons({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createLessonSuccess) {
      toast.success('Lesson added successfully!');
      dispatch(resetCreateLessonState());
      dispatch(getAllLessons({ page: currentPage }));
    }
  }, [createLessonSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateLessonSuccess) {
      toast.success('Lesson updated successfully!');
      dispatch(resetUpdateLessonState());
      dispatch(getAllLessons({ page: currentPage }));
    }
  }, [updateLessonSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteLessonSuccess) {
      toast.success('Lesson deleted successfully!');
      dispatch(resetDeleteLessonState());
      dispatch(getAllLessons({ page: currentPage }));
    }
  }, [deleteLessonSuccess, toast, dispatch, currentPage]);

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setShowAddLesson(false);
  };

  const handleAddLessonClick = () => {
    setShowAddLesson(true);
    setSelectedLesson(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedLesson(null);
    setShowAddLesson(false);
  };

  const handleSaveLesson = (updatedLesson) => {
    handleCloseRightSidebar();
  };

  const handleAddLesson = () => {
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
              onClick={handleAddLessonClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          <ListLesson
            lessons={lessons}
            pagination={pagination}
            onLessonClick={handleLessonClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedLesson || showAddLesson) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedLesson || showAddLesson) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddLesson ? (
                <AddLesson
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddLesson}
                />
              ) : (
                <EditLesson
                  lesson={selectedLesson}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveLesson}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
