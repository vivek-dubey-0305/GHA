import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListModule } from '../../components/module/ListModule';
import { EditModule } from '../../components/module/EditModule';
import { AddModule } from '../../components/module/AddModule';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllModules,
  selectModules,
  selectModulesLoading,
  selectModulesError,
  selectModulePagination,
  selectCreateModuleSuccess,
  selectUpdateModuleSuccess,
  selectDeleteModuleSuccess,
  resetCreateModuleState,
  resetUpdateModuleState,
  resetDeleteModuleState,
} from '../../redux/slices/module.slice.js';

export default function Modules() {
  const dispatch = useDispatch();
  const modules = useSelector(selectModules);
  const modulesLoading = useSelector(selectModulesLoading);
  const modulesError = useSelector(selectModulesError);
  const pagination = useSelector(selectModulePagination);
  const createModuleSuccess = useSelector(selectCreateModuleSuccess);
  const updateModuleSuccess = useSelector(selectUpdateModuleSuccess);
  const deleteModuleSuccess = useSelector(selectDeleteModuleSuccess);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllModules({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (createModuleSuccess) {
      toast.success('Module added successfully!');
      dispatch(resetCreateModuleState());
      dispatch(getAllModules({ page: currentPage }));
    }
  }, [createModuleSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (updateModuleSuccess) {
      toast.success('Module updated successfully!');
      dispatch(resetUpdateModuleState());
      dispatch(getAllModules({ page: currentPage }));
    }
  }, [updateModuleSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteModuleSuccess) {
      toast.success('Module deleted successfully!');
      dispatch(resetDeleteModuleState());
      dispatch(getAllModules({ page: currentPage }));
    }
  }, [deleteModuleSuccess, toast, dispatch, currentPage]);

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setShowAddModule(false);
  };

  const handleAddModuleClick = () => {
    setShowAddModule(true);
    setSelectedModule(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedModule(null);
    setShowAddModule(false);
  };

  const handleSaveModule = (updatedModule) => {
    handleCloseRightSidebar();
  };

  const handleAddModule = () => {
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
              onClick={handleAddModuleClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          <ListModule
            modules={modules}
            pagination={pagination}
            onModuleClick={handleModuleClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedModule || showAddModule) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedModule || showAddModule) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddModule ? (
                <AddModule
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddModule}
                />
              ) : (
                <EditModule
                  module={selectedModule}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveModule}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
