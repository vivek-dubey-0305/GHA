import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListInstructor } from '../../components/instructor/ListInstructor';
import { EditInstructor } from '../../components/instructor/EditInstructor';
import { AddInstructor } from '../../components/instructor/AddInstructor';
import { mockInstructors } from '../../data/mockInstructors';
import { Button, useToast } from '../../components/ui';

export default function Instructors() {
  const [instructors, setInstructors] = useState(mockInstructors);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showAddInstructor, setShowAddInstructor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

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
    setInstructors(prevInstructors =>
      prevInstructors.map(instructor => 
        instructor._id === updatedInstructor._id ? updatedInstructor : instructor
      )
    );
    toast.success('Instructor updated successfully!');
    handleCloseRightSidebar();
  };

  const handleAddInstructor = (newInstructor) => {
    const instructorToAdd = newInstructor;
    setInstructors(prevInstructors => [...prevInstructors, instructorToAdd]);
    toast.success('Instructor added successfully!');
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
              onClick={handleAddInstructorClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instructor
            </Button>
          </div>
          
          <ListInstructor
            instructors={instructors}
            onInstructorClick={handleInstructorClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
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
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] 
               overflow-y-auto overflow-x-hidden
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
