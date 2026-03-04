import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListUser } from '../../components/user/ListUser';
import { EditUser } from '../../components/user/EditUser';
import { AddUser } from '../../components/user/Adduser';
import { Button, useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsers, selectUsers, selectUsersLoading, selectUsersError, selectCreateUserSuccess, clearCreateUserError, resetCreateUserState } from '../../redux/slices/admin.slice.js';

export default function Users() {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const usersLoading = useSelector(selectUsersLoading);
  const usersError = useSelector(selectUsersError);
  const createUserSuccess = useSelector(selectCreateUserSuccess);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (createUserSuccess) {
      toast.success('User added successfully!');
      dispatch(resetCreateUserState());
    }
  }, [createUserSuccess, toast, dispatch]);

  useEffect(() => {
    console.log('🔍 SEARCH TERM CHANGED:', {
      value: searchTerm,
      length: searchTerm.length,
      timestamp: new Date().toLocaleTimeString(),
      stack: new Error().stack
    });
  }, [searchTerm]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowAddUser(false);
  };

  const handleAddUserClick = () => {
    setShowAddUser(true);
    setSelectedUser(null);
  };

  const handleCloseRightSidebar = () => {
    setSelectedUser(null);
    setShowAddUser(false);
  };

  const handleSaveUser = (updatedUser) => {
    // For now, just close. Update logic can be added later
    toast.success('User updated successfully!');
    handleCloseRightSidebar();
  };

  const handleAddUser = (newUser) => {
    // User added via Redux
    handleCloseRightSidebar();
  };

  return (
    <AdminLayout>
      <div className="flex h-full relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-8 pb-0 flex items-center justify-between">
            <div />
            <Button 
              onClick={handleAddUserClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
          
          <ListUser
            users={users}
            onUserClick={handleUserClick}
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              console.log('📌 SET SEARCH TERM CALLED:', {
                oldValue: searchTerm,
                newValue: value,
                timestamp: new Date().toLocaleTimeString()
              });
              setSearchTerm(value);
            }}
          />
        </div>

        {/* Overlay Backdrop */}
        {(selectedUser || showAddUser) && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {(selectedUser || showAddUser) && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              {showAddUser ? (
                <AddUser
                  onClose={handleCloseRightSidebar}
                  onAdd={handleAddUser}
                />
              ) : (
                <EditUser
                  user={selectedUser}
                  onClose={handleCloseRightSidebar}
                  onSave={handleSaveUser}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
