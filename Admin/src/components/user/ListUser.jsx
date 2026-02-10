import { Search, MoreVertical } from 'lucide-react';
import { mockUsers } from '../../data/mockUser';
import { Badge } from '../ui';


export function ListUser({ users, onUserClick, searchTerm, onSearchChange }) {
  const filteredUsers = users.filter(user => 
    (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-gray-400">Manage user accounts and permissions</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-gray-600 transition-colors"
        />
      </div>

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
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
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
                  <td className="px-6 py-4 text-gray-300">{user?.learningProgress.totalCoursesEnrolled}</td>
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
                      className="text-gray-400 hover:text-white transition-colors p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick(user);
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
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
    </div>
  );
}
