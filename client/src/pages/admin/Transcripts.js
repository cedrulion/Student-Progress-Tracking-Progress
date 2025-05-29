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
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [errorApproved, setErrorApproved] = useState(null);
  const [searchApproved, setSearchApproved] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Approved Requests
  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        setLoadingApproved(true);
        const res = await axios.get('http://localhost:5000/api/admin/transcripts/approved');
        setApprovedRequests(res.data.data);
      } catch (err) {
        console.error('Failed to fetch approved transcript requests:', err);
        setErrorApproved('Failed to load approved transcript requests. Please try again.');
        toast.error(err.response?.data?.message || 'Failed to fetch approved requests');
      } finally {
        setLoadingApproved(false);
      }
    };

    fetchApprovedRequests();
  }, []);

  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleViewSupportingDocuments = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true); // Reusing the main modal for details and documents
  };

  // Filter approved requests by search term
  const filteredApprovedRequests = approvedRequests.filter((request) => {
    const searchLower = searchApproved.toLowerCase();
    // Updated logic to avoid optional chaining for compatibility
    const institutionName = request.institution && request.institution.name ? request.institution.name.toLowerCase() : '';
    const studentFirstName = request.student && request.student.firstName ? request.student.firstName.toLowerCase() : '';
    const studentLastName = request.student && request.student.lastName ? request.student.lastName.toLowerCase() : '';
    const studentName = `${studentFirstName} ${studentLastName}`;
    const studentId = request.student && request.student.studentId ? request.student.studentId.toLowerCase() : '';
    const purpose = request.purpose ? request.purpose.toLowerCase() : '';

    return (
      institutionName.includes(searchLower) ||
      studentName.includes(searchLower) ||
      studentId.includes(searchLower) ||
      purpose.includes(searchLower)
    );
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'approved':
        return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'rejected':
        return 'bg-red-100 text-red-800 ring-red-600/20';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Transcript Requests
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Manage and view all student transcript requests.
          </p>
        </div>

        {/* Approved Requests Section */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h3 className="text-2xl leading-6 font-semibold text-gray-900">
              Approved Requests
            </h3>
            <input
              type="text"
              placeholder="Search approved requests..."
              className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              value={searchApproved}
              onChange={(e) => setSearchApproved(e.target.value)}
            />
          </div>
          {loadingApproved ? (
            <div className="flex justify-center items-center h-48">
              <Spinner />
            </div>
          ) : errorApproved ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-6">
              {errorApproved}
            </div>
          ) : filteredApprovedRequests.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-lg">
              No approved transcript requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Approved On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Institution
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApprovedRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.student?.firstName} {request.student?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.student?.studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(request.processedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="text-sm font-medium text-gray-900">
                          {request.institution?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.institution?.contactEmail || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={request.purpose}>
                        {request.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-3">
                          <button
                            onClick={() => viewRequestDetails(request)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150"
                          >
                            View Details
                          </button>
                          {request.supportingDocuments && request.supportingDocuments.length > 0 && (
                            <button
                              onClick={() => handleViewSupportingDocuments(request)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150"
                            >
                              View Documents
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal (now includes supporting documents) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedRequest && (
          <div className="p-6 bg-white rounded-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">
              Transcript Request Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Request Information</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Request ID:</span> {selectedRequest._id}</p>
                  <p><span className="font-semibold">Request Date:</span> {formatDate(selectedRequest.requestDate)}</p>
                  {selectedRequest.processedAt && (
                    <p><span className="font-semibold">Processed On:</span> {formatDate(selectedRequest.processedAt)}</p>
                  )}
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ring-1 ring-inset ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Purpose & Justification</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Purpose:</span> {selectedRequest.purpose}</p>
                  <p><span className="font-semibold">Justification:</span> {selectedRequest.justification || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Institution Information</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Name:</span> {selectedRequest.institution?.name || 'N/A'}</p>
                  <p><span className="font-semibold">Contact Email:</span> {selectedRequest.institution?.contactEmail || 'N/A'}</p>
                  <p>
                    <span className="font-semibold">Verification Status:</span>{' '}
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ring-1 ring-inset ${
                      selectedRequest.institution?.verificationStatus === 'verified' ?
                      'bg-green-100 text-green-800 ring-green-600/20' :
                      'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
                    }`}>
                      {selectedRequest.institution?.verificationStatus || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Student Information</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Name:</span> {selectedRequest.student?.firstName} {selectedRequest.student?.lastName}</p>
                  <p><span className="font-semibold">Student ID:</span> {selectedRequest.student?.studentId}</p>
                  <p><span className="font-semibold">Program:</span> {selectedRequest.student?.program || 'N/A'}</p>
                  <p><span className="font-semibold">Department:</span> {selectedRequest.student?.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedRequest.consentForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Consent Form</h3>
                <a
                  href={`http://localhost:5000${selectedRequest.consentForm}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center text-sm font-medium"
                >
                  <svg className="w-5 h-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Consent Form ({selectedRequest.consentForm.split('/').pop()})
                </a>
              </div>
            )}

            {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Supporting Documents (Admin Uploaded)</h3>
                <ul className="space-y-2">
                  {selectedRequest.supportingDocuments.map((docPath, index) => (
                    <li key={index}>
                      <a
                        href={`http://localhost:5000${docPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center text-sm font-medium"
                      >
                        <svg className="w-5 h-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        {`Document ${index + 1} (${docPath.split('/').pop()})`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 shadow-sm transition ease-in-out duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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