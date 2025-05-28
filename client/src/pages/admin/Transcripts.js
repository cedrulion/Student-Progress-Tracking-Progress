import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner'; // Assuming you have a Spinner component
import Modal from '../../components/ui/Modal'; // Assuming you have a Modal component

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminTranscripts = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]); // New state for approved requests
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true); // New loading state
  const [errorPending, setErrorPending] = useState(null);
  const [errorApproved, setErrorApproved] = useState(null); // New error state
  const [searchPending, setSearchPending] = useState('');
  const [searchApproved, setSearchApproved] = useState(''); // New search state for approved
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Pending Requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoadingPending(true);
        const res = await axios.get('http://localhost:5000/api/admin/transcripts/pending');
        setPendingRequests(res.data.data);
        setLoadingPending(false);
      } catch (err) {
        console.error('Failed to fetch pending transcript requests:', err);
        setErrorPending('Failed to load pending transcript requests. Please try again.');
        setLoadingPending(false);
        toast.error(err.response?.data?.message || 'Failed to fetch pending requests');
      }
    };

    fetchPendingRequests();
  }, []);

  // Fetch Approved Requests
  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        setLoadingApproved(true);
        const res = await axios.get('http://localhost:5000/api/admin/transcripts/approved');
        setApprovedRequests(res.data.data);
        setLoadingApproved(false);
      } catch (err) {
        console.error('Failed to fetch approved transcript requests:', err);
        setErrorApproved('Failed to load approved transcript requests. Please try again.');
        setLoadingApproved(false);
        toast.error(err.response?.data?.message || 'Failed to fetch approved requests');
      }
    };

    fetchApprovedRequests();
  }, []);

  const handleApproveReject = async (institutionId, requestId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/transcript-requests/${institutionId}/${requestId}`, { status });
      toast.success(`Request ${status} successfully!`);

      // Optimistically update the UI
      setPendingRequests(prevRequests =>
        prevRequests.filter(req => !(req.institution._id === institutionId && req._id === requestId))
      );
      // If approved, add to approved list (after fetching from backend, for data consistency)
      if (status === 'approved') {
        // Re-fetch approved requests to ensure data consistency
        const resApproved = await axios.get('http://localhost:5000/api/admin/transcripts/approved');
        setApprovedRequests(resApproved.data.data);
      }
    } catch (err) {
      console.error('Failed to update request:', err);
      toast.error(err.response?.data?.message || 'Failed to update request. Please try again.');
    }
  };

  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Filter pending requests by search term
  const filteredPendingRequests = pendingRequests.filter((request) => {
    const searchLower = searchPending.toLowerCase();
    const institutionName = request.institution.name.toLowerCase();
    const studentName = `${request.student.firstName} ${request.student.lastName}`.toLowerCase();
    const studentId = request.student.studentId.toLowerCase();
    const purpose = request.purpose?.toLowerCase() || '';
    return (
      institutionName.includes(searchLower) ||
      studentName.includes(searchLower) ||
      studentId.includes(searchLower) ||
      purpose.includes(searchLower)
    );
  });

  // Filter approved requests by search term
  const filteredApprovedRequests = approvedRequests.filter((request) => {
    const searchLower = searchApproved.toLowerCase();
    const institutionName = request.institution.name.toLowerCase();
    const studentName = `${request.student.firstName} ${request.student.lastName}`.toLowerCase();
    const studentId = request.student.studentId.toLowerCase();
    const purpose = request.purpose?.toLowerCase() || '';
    return (
      institutionName.includes(searchLower) ||
      studentName.includes(searchLower) ||
      studentId.includes(searchLower) ||
      purpose.includes(searchLower)
    );
  });


  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Pending Requests Section */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Pending Transcript Requests
            </h1>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <input
              type="text"
              placeholder="Search pending requests..."
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              value={searchPending}
              onChange={(e) => setSearchPending(e.target.value)}
            />
          </div>
        </div>

        {loadingPending ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : errorPending ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorPending}
          </div>
        ) : filteredPendingRequests.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">No pending transcript requests.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPendingRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.student.firstName} {request.student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.student.studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-sm font-medium text-gray-900">
                           {request.institution?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {request.institution?.contactEmail || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={request.purpose}>
                        {request.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleApproveReject(request.institution._id, request._id, 'approved')}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveReject(request.institution._id, request._id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                         <button
                          onClick={() => viewRequestDetails(request)}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        ---

        {/* Approved Requests Section */}
        <div className="md:flex md:items-center md:justify-between mb-6 mt-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Approved Transcript Requests
            </h1>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <input
              type="text"
              placeholder="Search approved requests..."
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              value={searchApproved}
              onChange={(e) => setSearchApproved(e.target.value)}
            />
          </div>
        </div>

        {loadingApproved ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : errorApproved ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorApproved}
          </div>
        ) : filteredApprovedRequests.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">No approved transcript requests.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApprovedRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.student.firstName} {request.student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.student.studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.processedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-sm font-medium text-gray-900">
                           {request.institution?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {request.institution?.contactEmail || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={request.purpose}>
                        {request.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewRequestDetails(request)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal (remains the same) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedRequest && (
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Transcript Request Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Request Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Request ID:</span> {selectedRequest._id}</p>
                  <p><span className="font-medium">Request Date:</span> {formatDate(selectedRequest.requestDate)}</p>
                  {selectedRequest.processedAt && (
                    <p><span className="font-medium">Processed On:</span> {formatDate(selectedRequest.processedAt)}</p>
                  )}
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Purpose & Justification</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Purpose:</span> {selectedRequest.purpose}</p>
                  <p><span className="font-medium">Justification:</span> {selectedRequest.justification || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Institution Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedRequest.institution.name}</p>
                  <p><span className="font-medium">Contact Email:</span> {selectedRequest.institution.contactEmail}</p>
                  <p>
                    <span className="font-medium">Verification Status:</span>{' '}
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedRequest.institution.verificationStatus === 'verified' ?
                      'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedRequest.institution.verificationStatus}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Student Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedRequest.student.firstName} {selectedRequest.student.lastName}</p>
                  <p><span className="font-medium">Student ID:</span> {selectedRequest.student.studentId}</p>
                  <p><span className="font-medium">Program:</span> {selectedRequest.student.program || 'N/A'}</p>
                  <p><span className="font-medium">Department:</span> {selectedRequest.student.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedRequest.consentForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Consent Form</h3>
                <a
                  href={selectedRequest.consentForm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Consent Form
                </a>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTranscripts;