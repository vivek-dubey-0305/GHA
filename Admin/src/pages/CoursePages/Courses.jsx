import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListCourse } from '../../components/course/ListCourse';
import { EditCourse } from '../../components/course/EditCourse';
import { AddCourse } from '../../components/course/AddCourse';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllCourses,
  selectCourses,
  selectCoursesLoading,
  selectCoursesError,
  selectCoursePagination,
  selectCreateFullCourseSuccess,
  selectUpdateFullCourseSuccess,
  selectDeleteCourseSuccess,
  resetCreateFullCourseState,
  resetUpdateFullCourseState,
  resetDeleteCourseState,
} from '../../redux/slices/course.slice.js';

export default function Courses() {
  const dispatch = useDispatch();
  const location = useLocation();
  const courses = useSelector(selectCourses);
  const coursesLoading = useSelector(selectCoursesLoading);
  const coursesError = useSelector(selectCoursesError);
  const pagination = useSelector(selectCoursePagination);
  const createFullCourseSuccess = useSelector(selectCreateFullCourseSuccess);
  const updateFullCourseSuccess = useSelector(selectUpdateFullCourseSuccess);
  const deleteCourseSuccess = useSelector(selectDeleteCourseSuccess);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [draftToResume, setDraftToResume] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  // Handle resume draft from Dashboard navigation
  useEffect(() => {
    if (location.state?.resumeDraft) {
      setDraftToResume(location.state.resumeDraft);
      setShowAddCourse(true);
      // Clear the state so it doesn't re-trigger on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    dispatch(getAllCourses({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createFullCourseSuccess) {
      toast.success('Course created successfully!');
      dispatch(resetCreateFullCourseState());
      dispatch(getAllCourses({ page: currentPage }));
      setShowAddCourse(false);
      setDraftToResume(null);
    }
  }, [createFullCourseSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateFullCourseSuccess) {
      dispatch(resetUpdateFullCourseState());
      dispatch(getAllCourses({ page: currentPage }));
    }
  }, [updateFullCourseSuccess, dispatch, currentPage]);

  useEffect(() => {
    if (deleteCourseSuccess) {
      toast.success('Course deleted successfully!');
      dispatch(resetDeleteCourseState());
      dispatch(getAllCourses({ page: currentPage }));
    }
  }, [deleteCourseSuccess, toast, dispatch, currentPage]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowAddCourse(false);
  };

  const handleAddCourseClick = () => {
    setShowAddCourse(true);
    setSelectedCourse(null);
    setDraftToResume(null);
  };

  const handleResumeDraft = (draft) => {
    setDraftToResume(draft);
    setShowAddCourse(true);
    setSelectedCourse(null);
  };

  const handleCloseAddCourse = () => {
    setShowAddCourse(false);
    setDraftToResume(null);
  };

  const handleCloseEditCourse = () => {
    setSelectedCourse(null);
  };

  const handleSaveCourse = () => {
    // EditCourse handles its own success toast & refresh; just close
    setSelectedCourse(null);
  };

  const handleAddCourse = () => {
    // Handled in useEffect above when createFullCourseSuccess triggers
    handleCloseAddCourse();
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
              onClick={handleAddCourseClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>

          <ListCourse
            courses={courses}
            pagination={pagination}
            onCourseClick={handleCourseClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Full-screen Edit Course Modal */}
        {selectedCourse && (
          <EditCourse
            course={selectedCourse}
            onClose={handleCloseEditCourse}
            onSave={handleSaveCourse}
          />
        )}

        {/* Full-screen Add Course Modal */}
        {showAddCourse && (
          <AddCourse
            onClose={handleCloseAddCourse}
            onAdd={handleAddCourse}
            draftCourse={draftToResume}
          />
        )}
      </div>
    </AdminLayout>
  );
}
