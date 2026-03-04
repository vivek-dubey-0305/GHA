import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListMaterial } from '../../components/material/ListMaterial';
import { EditMaterial } from '../../components/material/EditMaterial';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllMaterials,
  selectMaterials,
  selectMaterialsLoading,
  selectMaterialsError,
  selectMaterialPagination,
  selectUpdateMaterialSuccess,
  selectDeleteMaterialSuccess,
  resetUpdateMaterialState,
  resetDeleteMaterialState,
} from '../../redux/slices/material.slice.js';

export default function Materials() {
  const dispatch = useDispatch();
  const materials = useSelector(selectMaterials);
  const materialsLoading = useSelector(selectMaterialsLoading);
  const materialsError = useSelector(selectMaterialsError);
  const pagination = useSelector(selectMaterialPagination);
  const updateMaterialSuccess = useSelector(selectUpdateMaterialSuccess);
  const deleteMaterialSuccess = useSelector(selectDeleteMaterialSuccess);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllMaterials({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updateMaterialSuccess) {
      toast.success('Material updated successfully!');
      dispatch(resetUpdateMaterialState());
      dispatch(getAllMaterials({ page: currentPage }));
    }
  }, [updateMaterialSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteMaterialSuccess) {
      toast.success('Material deleted successfully!');
      dispatch(resetDeleteMaterialState());
      dispatch(getAllMaterials({ page: currentPage }));
    }
  }, [deleteMaterialSuccess, toast, dispatch, currentPage]);

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
  };

  const handleCloseRightSidebar = () => {
    setSelectedMaterial(null);
  };

  const handleSaveMaterial = (updatedMaterial) => {
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
          <ListMaterial
            materials={materials}
            pagination={pagination}
            onMaterialClick={handleMaterialClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedMaterial && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedMaterial && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditMaterial
                material={selectedMaterial}
                onClose={handleCloseRightSidebar}
                onSave={handleSaveMaterial}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
