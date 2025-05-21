import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const AdminRequests = () => {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/pending-requests');
        setRequests(res.data.data);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch requests');
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const viewRequestDetails = (request, type) => {
    setSelectedRequest(request);
    setRequestType(type);
    setIsModalOpen(true);
  };

  const approveRequest = async (type, id, status) => {
    try {
      if (type === 'transcript') {
        await axios.put(`http://localhost:5000/api/admin/approve-transcript/${id.student}/${id.request}`, { status });
        setRequests({
          ...requests,
          transcriptRequests: requests.transcriptRequests.filter(req => req._id !== id.request)
        });
      } else {
        await axios.put(`http://localhost:5000/api/admin/approve-progress/${id.institution}/${id.request}`, { status });
        setRequests({
          ...requests,
          progressRequests: requests.progressRequests.filter(req => req._id !== id.request)
        });
      }
      toast.success(`Request ${status} successfully`);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  if (loading) {
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
              Pending Requests
            </h1>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-8 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Transcript Requests
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              {requests.transcriptRequests.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  No pending transcript requests
                </div>
              ) : (
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
                      {requests.transcriptRequests.map((request) => (
                        <tr key={request._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {request.studentName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.studentId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.institution?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {request.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => viewRequestDetails(request, 'transcript')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Student Progress Requests
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              {requests.progressRequests.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  No pending progress requests
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institution
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {requests.progressRequests.map((request) => (
  <tr key={request._id}>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-gray-900">
        {request.institutionName}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-gray-900">
        {/* Check if student exists and display data safely */}
        {request.student && request.student.firstName ? 
          `${request.student.firstName} ${request.student.lastName}` : 
          'N/A'}
      </div>
      <div className="text-sm text-gray-500">
        {request.student && request.student.studentId ? 
          request.student.studentId : 'N/A'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(request.requestDate).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
      <button
        onClick={() => viewRequestDetails(request, 'progress')}
        className="text-blue-600 hover:text-blue-900"
      >
        View Details
      </button>
    </td>
  </tr>
))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedRequest && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {requestType === 'transcript' ? 'Transcript' : 'Progress'} Request Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Request Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Request ID:</span> {selectedRequest._id}</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedRequest.requestDate).toLocaleString()}</p>
                  <p><span className="font-medium">Status:</span> <span className="capitalize">{selectedRequest.status}</span></p>
                </div>
              </div>

              {requestType === 'transcript' ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Transcript Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Purpose:</span> {selectedRequest.purpose}</p>
                    <p><span className="font-medium">Delivery Method:</span> {selectedRequest.deliveryMethod || 'N/A'}</p>
                    <p><span className="font-medium">Recipient Email:</span> {selectedRequest.recipientEmail || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Progress Request Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Purpose:</span> {selectedRequest.purpose}</p>
                    <p><span className="font-medium">Justification:</span> {selectedRequest.justification}</p>
                    <p>
                      <span className="font-medium">Requested Data:</span> 
                      {selectedRequest.requestedData?.join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  {requestType === 'transcript' ? 'Student' : 'Institution'} Information
                </h3>
                <div className="space-y-2">
                  {requestType === 'transcript' ? (
                    <>
                      <p><span className="font-medium">Name:</span> {selectedRequest.studentName}</p>
                      <p><span className="font-medium">ID:</span> {selectedRequest.studentId}</p>
                      <p><span className="font-medium">Program:</span> {selectedRequest.student?.program || 'N/A'}</p>
                    </>
                  ) : (
                    <>
                      <p><span className="font-medium">Institution:</span> {selectedRequest.institutionName}</p>
                      <p><span className="font-medium">Contact Email:</span> {selectedRequest.contactEmail || 'N/A'}</p>
                      <p><span className="font-medium">Verification Status:</span> {selectedRequest.verificationStatus || 'N/A'}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  {requestType === 'transcript' ? 'Institution' : 'Student'} Information
                </h3>
                <div className="space-y-2">
                  {requestType === 'transcript' ? (
                    <>
                      <p><span className="font-medium">Name:</span> {selectedRequest.institution?.name || 'N/A'}</p>
                      <p><span className="font-medium">Contact:</span> {selectedRequest.institution?.contactPhone || 'N/A'}</p>
                    </>
                  ) : (
                    <>
                      <p><span className="font-medium">Student Name:</span> {selectedRequest.student.firstName} {selectedRequest.student?.lastName}</p>
                      <p><span className="font-medium">Student ID:</span> {selectedRequest.student?.studentId}</p>
                      <p><span className="font-medium">Program:</span> {selectedRequest.student?.program || 'N/A'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {requestType === 'progress' && selectedRequest.consentForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Consent Form</h3>
                <a 
                  href={selectedRequest.consentForm} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Consent Form
                </a>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => approveRequest(
                  requestType,
                  requestType === 'transcript' 
                    ? { student: selectedRequest.student, request: selectedRequest._id }
                    : { institution: selectedRequest.institution, request: selectedRequest._id },
                  'rejected'
                )}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => approveRequest(
                  requestType,
                  requestType === 'transcript' 
                    ? { student: selectedRequest.student, request: selectedRequest._id }
                    : { institution: selectedRequest.institution, request: selectedRequest._id },
                  'approved'
                )}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminRequests;