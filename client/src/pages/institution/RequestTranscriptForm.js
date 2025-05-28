import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner'; // Assuming you have a Spinner component

const RequestTranscriptForm = () => {
  const { studentId } = useParams();
  const [formData, setFormData] = useState({
    purpose: '',
    justification: '',
    consentForm: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, consentForm: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('justification', formData.justification);

      if (formData.consentForm) {
        formDataToSend.append('consentForm', formData.consentForm);
      }

      await axios.post(
        `http://localhost:5000/api/institutions/request-transcript/${studentId}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Transcript request submitted successfully!');
      navigate('/institution/transcript-requests'); // Navigate to a page showing transcript requests
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit transcript request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
            <h2 className="text-2xl font-bold text-white">
              Request Student Transcript
            </h2>
            <p className="mt-1 text-purple-100">
              Please provide details about your request for a student transcript.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div className="space-y-1">
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                Purpose of Transcript Request *
              </label>
              <select
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Select a purpose</option>
                <option value="admission">Admission Application</option>
                <option value="employment">Employment Application</option>
                <option value="further_education">Further Education</option>
                <option value="scholarship">Scholarship Application</option>
                <option value="personal">Personal Record</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.purpose === 'other' && (
              <div className="space-y-1">
                <label htmlFor="otherPurpose" className="block text-sm font-medium text-gray-700">
                  Specify Other Purpose *
                </label>
                <input
                  type="text"
                  id="otherPurpose"
                  name="purpose" // Reusing purpose field for 'other'
                  value={formData.purpose}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
                Justification / Additional Details *
              </label>
              <textarea
                id="justification"
                name="justification"
                rows="4"
                value={formData.justification}
                onChange={handleChange}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="Explain why you are requesting this transcript..."
                required
              ></textarea>
            </div>

            <div className="space-y-1">
              <label htmlFor="consentForm" className="block text-sm font-medium text-gray-700">
                Upload Consent Form (Optional)
                <p className="mt-1 text-sm text-gray-500">A signed consent form from the student might be required.</p>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 32" strokeWidth="2" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="consentForm" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                  {formData.consentForm && (
                    <p className="text-sm text-gray-700 mt-2">Selected file: {formData.consentForm.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {isSubmitting ? <Spinner size="sm" /> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestTranscriptForm;