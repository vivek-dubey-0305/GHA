import { Search, MoreVertical, Trash2 } from 'lucide-react';
import { mockUsers } from '../../data/mockUser';
import { Badge, SearchBar } from '../ui';
import WarningModal from '../ui/modals/warning-modal';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUser, selectDeleteUserLoading, selectDeleteUserError, selectDeleteUserSuccess } from '../../redux/slices/admin.slice';


export function ListUser({ users, onUserClick, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteUserLoading = useSelector(selectDeleteUserLoading);
  const deleteUserError = useSelector(selectDeleteUserError);
  const deleteUserSuccess = useSelector(selectDeleteUserSuccess);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const filteredUsers = users.filter(user => 
    (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete._id)).unwrap();
        // Optionally, you can remove from local state or call a callback
        // For now, assume parent will re-fetch
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        // Error handled by slice
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-gray-400">Manage user accounts and permissions</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={(value) => {
          console.log('📌 SET SEARCH TERM CALLED:', {
            oldValue: searchTerm,
            newValue: value,
            timestamp: new Date().toLocaleTimeString()
          });
          onSearchChange(value);
        }}
        placeholder="Search by name or email..."
        context="users"
      />

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Courses</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Verified</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  onClick={() => onUserClick(user)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        {user.profilePicture?.secure_url ? (
                          <img 
                            src={user.profilePicture.secure_url} 
                            alt={`${user.firstName} ${user.lastName}`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user?.email}</td>
                  <td className="px-6 py-4 text-gray-300">{user?.phone}</td>
                  <td className="px-6 py-4 text-gray-300">{user?.learningProgress?.totalCoursesEnrolled || 0}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user?.isActive ? "default" : "secondary"} className={user?.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {user.isEmailVerified && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">Email</Badge>
                      )}
                      {user.isPhoneVerified && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">Phone</Badge>
                      )}
                      {user.isKYCVerified && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">KYC</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-red-500 hover:text-red-700 transition-colors p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(user);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-400">
          Showing {filteredUsers.length} of {users.length} users
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors">
            Previous
          </button>
          <button className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors">
            Next
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone and will also remove their profile picture from storage.`}
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
