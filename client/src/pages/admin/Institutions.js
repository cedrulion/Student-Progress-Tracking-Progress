import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/institutions');
        setInstitutions(res.data.data);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch institutions');
        setLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  const verifyInstitution = async (institutionId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/verify-institution/${institutionId}`, { status });
      setInstitutions(institutions.map(inst => 
        inst._id === institutionId ? { ...inst, verificationStatus: status } : inst
      ));
      toast.success(`Institution ${status} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update institution');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Institutions
            </h1>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Institution Directory
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {institutions.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No institutions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Email
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
                    {institutions.map((institution) => (
                      <tr key={institution._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {institution.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {institution.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {institution.contactEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            institution.verificationStatus === 'verified' 
                              ? 'bg-green-100 text-green-800'
                              : institution.verificationStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {institution.verificationStatus.charAt(0).toUpperCase() + institution.verificationStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {institution.verificationStatus === 'pending' && (
                            <div className="space-x-2">
                              <button
                                onClick={() => verifyInstitution(institution._id, 'verified')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => verifyInstitution(institution._id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </div>
                          )}
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
  );
};

export default AdminInstitutions;