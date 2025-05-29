import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

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

const ApprovedProgressTable = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/admin/progress/approved');
        setRequests(res.data.data);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch approved requests');
        setLoading(false);
      }
    };

    fetchApprovedRequests();
  }, []);

  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Filter requests by search term in institution name or student name/id or purpose
  const filteredRequests = requests.filter((request) => {
    const searchLower = search.toLowerCase();
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
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-h-[600px] overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Approved Progress Requests
            </h1>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <input
              type="text"
              placeholder="Search requests..."
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Institution
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Student
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Request Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Approved On
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Purpose
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No approved progress requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.institution.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.institution.contactEmail}
                          </div>
                        </td>
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
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={request.purpose}>
                          {request.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewRequestDetails(request)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedRequest && (
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Approved Progress Request Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Request Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Request ID:</span> {selectedRequest._id}</p>
                  <p><span className="font-medium">Request Date:</span> {formatDate(selectedRequest.requestDate)}</p>
                  <p><span className="font-medium">Approved On:</span> {formatDate(selectedRequest.processedAt)}</p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedRequest.status === 'approved' ?
                        'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800' // Fallback, though it should always be 'approved' here
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
                  <p><span className="font-medium">Justification:</span> {selectedRequest.justification}</p>
                  <div>
                    <span className="font-medium">Requested Data:</span>
                    <ul className="list-disc list-inside mt-1">
                      {selectedRequest.requestedData?.map((data, index) => (
                        <li key={index}>{data}</li>
                      ))}
                    </ul>
                  </div>
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

            {/* Display existing Supporting Documents */}
            {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Supporting Document(s)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedRequest.supportingDocuments.map((docPath, index) => (
                    <li key={index}>
                      <a
                        href={`http://localhost:5000${docPath}`} // Assuming your backend serves static files from /uploads
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        {`Document ${index + 1} (${docPath.split('/').pop()})`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

export default ApprovedProgressTable;