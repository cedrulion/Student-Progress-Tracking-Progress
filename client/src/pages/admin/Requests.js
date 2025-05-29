import { useState, useEffect, useRef } from 'react'; // Import useRef
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
  const fileInputRef = useRef(null); // Ref for the file input

  // Fetches pending requests from the API on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true); // Set loading true before fetching
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

  // Sets the selected request and its type, then opens the modal
  const viewRequestDetails = (request, type) => {
    setSelectedRequest(request);
    setRequestType(type);
    setIsModalOpen(true);
  };

  // Handles the approval or rejection of a request, including file uploads
  const approveRequest = async (type, institutionId, requestId, status) => {
    try {
      const formData = new FormData();
      formData.append('status', status);

      // Append selected files if any
      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
        for (let i = 0; i < fileInputRef.current.files.length; i++) {
          formData.append('supportingDocuments', fileInputRef.current.files[i]);
        }
      }

      let res;
      if (type === 'transcript') {
        // THIS IS THE CRITICAL LINE FOR THE URL
        res = await axios.put(
          `http://localhost:5000/api/admin/transcript-requests/${institutionId}/${requestId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data', // Important for file uploads
            },
          }
        );
        // Update the state to remove the approved/rejected transcript request
        setRequests(prevRequests => ({
          ...prevRequests,
          transcriptRequests: prevRequests.transcriptRequests.filter(req => req._id !== requestId)
        }));
      } else { // type === 'progress'
        // THIS IS THE CRITICAL LINE FOR THE URL
        res = await axios.put(
          `http://localhost:5000/api/admin/progress-requests/${institutionId}/${requestId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data', // Important for file uploads
            },
          }
        );
        // Update the state to remove the approved/rejected progress request
        setRequests(prevRequests => ({
          ...prevRequests,
          progressRequests: prevRequests.progressRequests.filter(req => req._id !== requestId)
        }));
      }

      toast.success(`Request ${status} successfully`);
      setIsModalOpen(false);
      // Clear the file input after successful submission
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error updating request:', err); // Log the error for debugging
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  // Displays a spinner while loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Ensure requests is not null before trying to access its properties
  if (!requests) {
      return (
          <div className="text-center py-10 text-gray-500">
              No requests data available.
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
          {/* Transcript Requests Section */}
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
                                  {request.student?.firstName} {request.student?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.student?.studentId}
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

          {/* Student Progress Requests Section */}
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
                              {request.institution?.name || 'N/A'} {/* Access name from nested institution */}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
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
                    <p><span className="font-medium">Justification:</span> {selectedRequest.justification || 'N/A'}</p>
                    <p><span className="font-medium">Consent Form:</span> {selectedRequest.consentForm ? <a href={selectedRequest.consentForm} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Form</a> : 'N/A'}</p>
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
                  Requesting Institution Information
                </h3>
                <div className="space-y-2">
                  {/* Access institution details from the nested 'institution' object */}
                  <p><span className="font-medium">Name:</span> {selectedRequest.institution?.name || 'N/A'}</p>
                  <p><span className="font-medium">Contact Email:</span> {selectedRequest.institution?.contactEmail || 'N/A'}</p>
                  <p><span className="font-medium">Verification Status:</span> {selectedRequest.institution?.verificationStatus || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  Student Information
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Student Name:</span> {selectedRequest.student?.firstName} {selectedRequest.student?.lastName}</p>
                  <p><span className="font-medium">Student ID:</span> {selectedRequest.student?.studentId}</p>
                  <p><span className="font-medium">Program:</span> {selectedRequest.student?.program || 'N/A'}</p>
                  <p><span className="font-medium">Department:</span> {selectedRequest.student?.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Display existing Supporting Documents */}
            {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Existing Supporting Document(s)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedRequest.supportingDocuments.map((docPath, index) => (
                    <li key={index}>
                      <a
                        href={`http://localhost:5000${docPath}`} // Assuming your backend serves static files from /uploads
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
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
                  className="text-blue-600 hover:underline"
                >
                  View Consent Form
                </a>
              </div>
            )}

            {/* File input for new supporting documents */}
            <div className="mt-4 mb-6">
              <label htmlFor="supportingDocuments" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Supporting Document(s) (Optional)
              </label>
              <input
                type="file"
                id="supportingDocuments"
                name="supportingDocuments"
                multiple // Allow multiple file selection
                ref={fileInputRef} // Attach the ref here
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                You can upload one or more files to support your decision.
              </p>
            </div>


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
                  selectedRequest.institution._id, // This remains correct
                  selectedRequest._id,
                  'rejected'
                )}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => approveRequest(
                  requestType,
                  selectedRequest.institution._id, // This remains correct
                  selectedRequest._id,
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