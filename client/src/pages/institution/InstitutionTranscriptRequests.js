import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

const InstitutionTranscriptRequests = () => {
  const [transcriptRequests, setTranscriptRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscriptRequests = async () => {
      try {
        setLoading(true);
        // Ensure Axios is configured to send tokens for all requests, or pass it here
        const token = localStorage.getItem('token'); // Get your token from storage
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        const res = await axios.get('http://localhost:5000/api/institutions/transcript-requests', config);
        setTranscriptRequests(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transcript requests.');
        toast.error(err.response?.data?.message || 'Failed to fetch transcript requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscriptRequests();
  }, []);

  // --- New handleDownload function ---
  const handleDownload = async (studentId, studentName) => {
    try {
      const token = localStorage.getItem('token'); // Get your authentication token
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      // Make an Axios GET request to the download endpoint
      const response = await axios.get(
        `http://localhost:5000/api/institutions/students/${studentId}/transcript/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the authentication token
          },
          responseType: 'blob', // Important: tells Axios to expect a binary response (like a PDF)
        }
      );

      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a URL for the Blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${studentName}_transcript.pdf`); // Suggest a filename
      document.body.appendChild(link);

      // Programmatically click the link to trigger the download
      link.click();

      // Clean up by revoking the object URL and removing the link
      window.URL.revokeObjectURL(url);
      link.remove();
      toast.success('Transcript downloaded successfully!');
    } catch (err) {
      console.error('Error downloading transcript:', err);
      // More specific error handling based on backend response
      if (err.response && err.response.status === 403) {
        toast.error('You do not have an approved request to download this transcript or your institution is not verified.');
      } else if (err.response && err.response.status === 404) {
        toast.error('Student or transcript not found.');
      } else if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Download failed: ${err.response.data.message}`);
      } else {
        toast.error('Failed to download transcript. Please try again.');
      }
    }
  };
  // --- End new handleDownload function ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert type="error" message={error} />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Transcript Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View the status of all transcript requests you have submitted.
            </p>
          </div>
        </div>

        {transcriptRequests.length === 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transcript requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't requested any transcripts yet. Search for a student to make a request.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Justification
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transcriptRequests.map((request) => (
                      <tr key={request._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.student ? (
                            <div className="text-sm font-medium text-gray-900">
                              {request.student.firstName} {request.student.lastName}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">N/A</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.student ? request.student.studentId : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.purpose}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {request.justification}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'approved' && request.student && (
                            <button
                              onClick={() =>
                                handleDownload(
                                  request.student._id,
                                  `${request.student.firstName}_${request.student.lastName}`
                                )
                              }
                              className="text-indigo-600 hover:text-indigo-900 mr-4 focus:outline-none"
                            >
                              Download Transcript
                            </button>
                          )}
                          {/* Add other actions like 'View Details' if needed */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionTranscriptRequests;