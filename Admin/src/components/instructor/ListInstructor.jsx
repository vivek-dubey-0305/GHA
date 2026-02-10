import { Search, MoreVertical, Star } from 'lucide-react';
import { mockInstructors } from '../../data/mockInstructors';
import { Badge } from '../ui';


export function ListInstructor({ instructors, onInstructorClick, searchTerm, onSearchChange }) {
  const filteredInstructors = instructors.filter(instructor => 
    instructor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Instructors</h1>
        <p className="text-gray-400">Manage instructor accounts and courses</p>
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Courses</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Students</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Rating</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstructors.map((instructor) => (
                <tr
                  key={instructor._id}
                  onClick={() => onInstructorClick(instructor)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        {instructor.profilePicture ? (
                          <img 
                            src={instructor.profilePicture} 
                            alt={`${instructor.firstName} ${instructor.lastName}`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {instructor.firstName[0]}{instructor.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{instructor.firstName} {instructor.lastName}</p>
                        <p className="text-xs text-gray-500">{instructor.yearsOfExperience} years exp</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{instructor.email}</td>
                  <td className="px-6 py-4 text-gray-300">{instructor.totalCourses}</td>
                  <td className="px-6 py-4 text-gray-300">{instructor.totalStudentsTeaching}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-medium">{instructor.rating.averageRating}</span>
                      <span className="text-gray-500 text-sm">({instructor.rating.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={instructor.isActive && !instructor.isSuspended ? "default" : "secondary"} 
                      className={instructor.isActive && !instructor.isSuspended ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {instructor.isSuspended ? 'Suspended' : instructor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-gray-400 hover:text-white transition-colors p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstructorClick(instructor);
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
          Showing {filteredInstructors.length} of {instructors.length} instructors
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
