import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const StudentRequestForm = () => {
  const { studentId } = useParams();
  const [formData, setFormData] = useState({
    purpose: '',
    justification: '',
    requestedData: [],
    consentForm: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const dataOptions = [
    { id: 'academic_records', name: 'Academic Records' },

  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, consentForm: e.target.files[0] }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, requestedData: [...prev.requestedData, value] };
      } else {
        return { ...prev, requestedData: prev.requestedData.filter(item => item !== value) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('studentId', studentId);
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('justification', formData.justification);
      
      // Append each requestedData item
      formData.requestedData.forEach(item => {
        formDataToSend.append('requestedData', item);
      });
      
      if (formData.consentForm) {
        formDataToSend.append('consentForm', formData.consentForm);
      }
  
      await axios.post(
        `http://localhost:5000/api/institutions/request-progress/${studentId}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      toast.success('Request submitted successfully!');
      navigate('/institution/requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h2 className="text-2xl font-bold text-white">
              Request Student Information
            </h2>
            <p className="mt-1 text-blue-100">
              Please provide details about your request for academic information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div className="space-y-1">
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                Purpose of Request *
              </label>
              <select
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Select a purpose</option>
                <option value="admission">Admission Consideration</option>
                <option value="scholarship">Scholarship Evaluation</option>
                <option value="employment">Employment Verification</option>
                <option value="research">Academic Research</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.purpose === 'other' && (
              <div className="space-y-1">
                <label htmlFor="customPurpose" className="block text-sm font-medium text-gray-700">
                  Please specify *
                </label>
                <input
                  type="text"
                  id="customPurpose"
                  name="customPurpose"
                  className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
                Justification for Request *
                <p className="text-xs text-gray-500 mt-1">
                  Please explain in detail why you need this student's information and how it will be used.
                </p>
              </label>
              <textarea
                id="justification"
                name="justification"
                rows={4}
                value={formData.justification}
                onChange={handleChange}
                className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                placeholder="We require this information to evaluate the student's eligibility for our scholarship program..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Requested Information *
                <p className="text-xs text-gray-500 mt-1">
                  Select all types of information you need
                </p>
              </label>
              <div className="mt-2 space-y-2">
                {dataOptions.map((option) => (
                  <div key={option.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`data-${option.id}`}
                        name="requestedData"
                        type="checkbox"
                        value={option.id}
                        checked={formData.requestedData.includes(option.id)}
                        onChange={handleCheckboxChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`data-${option.id}`} className="font-medium text-gray-700">
                        {option.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Consent Form (if required)
                <p className="text-xs text-gray-500 mt-1">
                  Upload a signed consent form from the student if required by your institution's policies
                </p>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="consentForm"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="consentForm"
                        name="consentForm"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOCX up to 5MB
                  </p>
                  {formData.consentForm && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected file: {formData.consentForm.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Privacy Notice</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      By submitting this request, you acknowledge that you have a legitimate educational interest in this student's information.
                      All requests are subject to review by the student and the university administration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.purpose || !formData.justification || formData.requestedData.length === 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting || !formData.purpose || !formData.justification || formData.requestedData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRequestForm;