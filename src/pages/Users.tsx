import { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import { Search, ShieldAlert, CheckCircle, Trash2, Eye } from 'lucide-react';
import UserDetails from '../components/UserDetails';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  blocked: boolean;
  onboardingCompleted: boolean;
  isVerified: boolean;
  createdAt: string;
  wellnessProfile?: any;
  assessmentDocs?: any;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Assuming 'role' and 'blocked' might be state variables to be added later,
      // for now, using existing 'search' and 'page' and new 'limit: 20'
      const data = await userService.getUsers({ search, page: page, limit: 20 });
      setUsers(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (e) { 
      console.error('Failed to fetch users', e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  const handleBlockToggle = async (user: User) => {
    try {
      await userService.blockUser(user._id, !user.blocked);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, blocked: !user.blocked } : u));
    } catch (e) { 
      console.error('Failed to toggle block status', e); 
      alert('Could not update block status');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (e) { 
      console.error('Failed to delete user', e); 
      alert('Could not delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Users Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage patient and doctor accounts, and view mental health assessments.</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role / Registration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="ml-4 truncate">
                          <div className="text-sm font-medium text-gray-900">{user.username || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{user.email || 'No email provided'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex leading-5 text-xs font-semibold rounded-full pb-0.5 ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'doctor' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.blocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3 gap-2">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="text-primary-600 hover:text-primary-900 transition-colors p-1 rounded-md hover:bg-primary-50"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {user.role !== 'admin' && ( // Prevent admin self-actions if possible, for UI safety
                          <>
                            <button 
                              onClick={() => handleBlockToggle(user)}
                              className={`${user.blocked ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'} transition-colors p-1 rounded-md`}
                              title={user.blocked ? "Unblock User" : "Block User"}
                            >
                              <ShieldAlert className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(user._id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded-md hover:bg-red-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder, can be enhanced with actual pagination controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-sm text-gray-500 self-center">Page {page} of {totalPages}</div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetails 
          userId={selectedUser._id} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}
