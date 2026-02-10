import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListCourse } from '../../components/course/ListCourse';
import { EditCourse } from '../../components/course/EditCourse';
import { AddCourse } from '../../components/course/AddCourse';
import { mockCourses } from '../../data/mockCourses';
import { Button, useToast } from '../../components/ui';

export default function Courses() {
  const [courses, setCourses] = useState(mockCourses);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowAddCourse(false);
  };

  const handleAddCourseClick = () => {
    setShowAddCourse(true);
    setSelectedCourse(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedCourse(null);
    setShowAddCourse(false);
  };

  const handleSaveCourse = (updatedCourse) => {
    setCourses(prevCourses =>
      prevCourses.map(course => 
        course._id === updatedCourse._id ? updatedCourse : course
      )
    );
    toast.success('Course updated successfully!');
    handleCloseRightSidebar();
  };

  const handleAddCourse = (newCourse) => {
    const courseToAdd = newCourse;
    setCourses(prevCourses => [...prevCourses, courseToAdd]);
    toast.success('Course added successfully!');
    handleCloseRightSidebar();
  };

  return (
    <AdminLayout>
      <div className="flex h-full">
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
            onCourseClick={handleCourseClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedCourse || showAddCourse) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedCourse || showAddCourse) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] 
               overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddCourse ? (
                <AddCourse
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddCourse}
                />
              ) : (
                <EditCourse
                  course={selectedCourse}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveCourse}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
