import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';

const InstitutionStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all students on component mount but keep them hidden until searched
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/institutions/students');
        setStudents(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch students');
      } finally {
        setInitialLoad(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    
    // Simulating a search API call with a delay
    setTimeout(() => {
      if (!searchTerm.trim()) {
        setSearchedStudents([]);
        setError('Please enter a student ID to search');
        setSearching(false);
        return;
      }

      // Filter students by student ID
      const results = students.filter(student => 
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (results.length === 0) {
        setError('No student found with that ID');
      }
      
      setSearchedStudents(results);
      setSearching(false);
    }, 800);
  };

  const handleRequestProgress = async (studentId) => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/institutions/request-progress',
        { studentId }
      );
      toast.success('Progress request submitted successfully');
      
      // Update the UI to show request is pending
      setSearchedStudents(searchedStudents.map(s => 
        s._id === studentId ? {...s, requested: true, requestStatus: 'pending'} : s
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request progress');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              University of Rwanda - Student Academic Progress
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Search for students by their ID to request academic progress information
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Student Search
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSearch} className="sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="studentId" className="sr-only">Student ID</label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter Student ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {searching ? <Spinner size="sm" /> : 'Search'}
              </button>
            </form>
            
            {error && (
              <div className="mt-4">
                <Alert type="error" message={error} />
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        {searchedStudents.length > 0 && (
          <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Search Results
              </h3>
              <span className="text-sm text-gray-500">
                {searchedStudents.length} student{searchedStudents.length !== 1 ? 's' : ''} found
              </span>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchedStudents.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {loading && student._id === student._id ? (
                            <Spinner size="sm" />
                          ) : student.requested ? (
                            student.requestStatus === 'approved' ? (
                              <Link
                                to={`/institution/student-progress/${student._id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Progress
                              </Link>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Request Pending
                              </span>
                            )
                          ) : (
                            <button
                            onClick={() => navigate(`/institution/request-progress/${student._id}`)}
  className="text-blue-600 hover:text-blue-900 font-medium"
>
  Request Progress
</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no search has been performed */}
        {!searching && searchedStudents.length === 0 && !error && (
          <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-12 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students searched</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a student ID above to view their information.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionStudents;