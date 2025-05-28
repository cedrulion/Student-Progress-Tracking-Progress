import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import axios from 'axios';

const AdminDashboard = () => {

  const [stats, setStats] = useState({
    students: [],
    institutions: [],
    pendingTranscripts: [],
    pendingProgress: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, institutionsRes, transcriptsRes, progressRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/students/count'),
          axios.get('http://localhost:5000/api/admin/institutions/count'),
          axios.get('http://localhost:5000/api/admin/transcripts/pending-count'),
          axios.get('http://localhost:5000/api/admin/progress/pending-count')
        ]);
        
        setStats({
          students: studentsRes.data.count,
          institutions: institutionsRes.data.count,
          pendingTranscripts: transcriptsRes.data.count,
          pendingProgress: progressRes.data.count
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Students Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Students</h3>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.students}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link to="/admin/students" className="font-medium text-blue-600 hover:text-blue-500">
                  View all students<span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Institutions Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Institutions</h3>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.institutions}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link to="/admin/institutions" className="font-medium text-blue-600 hover:text-blue-500">
                  View all institutions<span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Transcripts Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Transcripts</h3>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingTranscripts}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link to="/admin/transcripts" className="font-medium text-blue-600 hover:text-blue-500">
                  Review requests<span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Progress Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
  <div className="px-4 py-5 sm:p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="ml-5 w-0 flex-1">
        <h3 className="text-lg font-medium text-gray-900">Pending Progress</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingProgress}</p>
      </div>
    </div>
  </div>
  <div className="bg-gray-50 px-4 py-4 sm:px-6">
    <div className="text-sm">
      <Link to="/admin/requests" className="font-medium text-blue-600 hover:text-blue-500">
        Review requests<span aria-hidden="true"> &rarr;</span>
      </Link>
    </div>
  </div>
</div>

<div className="bg-white overflow-hidden shadow rounded-lg">
  <div className="px-4 py-5 sm:p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="ml-5 w-0 flex-1">
        <h3 className="text-lg font-medium text-gray-900">Approved Request</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingProgress}</p>
      </div>
    </div>
  </div>
  <div className="bg-gray-50 px-4 py-4 sm:px-6">
    <div className="text-sm">
      <Link to="/admin/approved" className="font-medium text-blue-600 hover:text-blue-500">
        Approved requests<span aria-hidden="true"> &rarr;</span>
      </Link>
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;