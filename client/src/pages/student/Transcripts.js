import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const StudentTranscript = () => {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/students/transcript');
        setTranscript(res.data.data);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load transcript');
        setLoading(false);
      }
    };

    fetchTranscript();
  }, []);

  const handleDownload = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/students/transcript/download',
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript_${user.studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download transcript');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transcript...</div>;
  }

  if (!transcript) {
    return <div className="text-center py-8">Transcript not available</div>;
  }

  // Calculate total retake attempts
  const retakeCount = transcript.courses.reduce((count, yearGroup) => {
    return count + yearGroup.courses.reduce((yearCount, course) => {
      return yearCount + (course.retakeAttempts?.length || 0);
    }, 0);
  }, 0);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Academic Transcript
            </h1>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download Transcript
            </button>
          </div>
        </div>

        {retakeCount >= 3 && (
          <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <p className="font-bold">Important Notice:</p>
            <p>
              You have accumulated {retakeCount} retakes, which exceeds the maximum allowed.
              You are no longer eligible to continue your studies at the University.
            </p>
          </div>
        )}

        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Student Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="mt-1 text-sm text-gray-900">
                  {transcript.student.firstName} {transcript.student.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Student ID</p>
                <p className="mt-1 text-sm text-gray-900">
                  {transcript.student.studentId}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Program</p>
                <p className="mt-1 text-sm text-gray-900">
                  {transcript.student.program || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="mt-1 text-sm text-gray-900">
                  {transcript.student.department || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">GPA</p>
                <p className="mt-1 text-sm text-gray-900 font-bold">
                  {transcript.gpa}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Retakes</p>
                <p className="mt-1 text-sm text-gray-900 font-bold">
                  {retakeCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {transcript.courses.map((yearGroup, yearIndex) => (
          <div key={yearIndex} className="mt-8 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Academic Year: {yearGroup.year}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retake Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Marks
                    </th> {/* Updated header */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yearGroup.courses.map((course, courseIndex) => {
                    // Get all grades (original + retakes)
                    const allGrades = [{
                      grade: course.originalGrade,
                      marks: course.originalMarks,
                      type: 'Original'
                    }];

                    course.retakeAttempts?.forEach(attempt => {
                      allGrades.push({
                        grade: attempt.grade,
                        marks: attempt.marks,
                        type: 'Retake'
                      });
                    });

                    // Find best grade
                    let bestGrade = { grade: 'N/A', marks: -1, type: '' }; // Initialize type

                    // Define grade points for comparison
                    const gradePoints = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0, 'N/A': -1 }; // Added N/A for safety

                    allGrades.forEach(g => {
                      if (g.grade !== 'N/A') {
                        if (g.marks > bestGrade.marks) {
                          bestGrade = g;
                        } else if (g.marks === bestGrade.marks &&
                                   gradePoints[g.grade] > gradePoints[bestGrade.grade]) {
                          bestGrade = g;
                        }
                      }
                    });

                    // --- MODIFICATION START ---
                    // If the best grade type is 'Retake', set marks to 50
                    if (bestGrade.type === 'Retake') {
                      bestGrade = { ...bestGrade, marks: 50 };
                    }
                    // --- MODIFICATION END ---

                    return (
                      <tr key={courseIndex} className={course.retakeAttempts?.length > 0 ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.originalGrade === 'F' || course.originalGrade === 'E'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {course.originalGrade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.originalMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.retakeAttempts?.length > 0 ? (
                            <div className="space-y-1">
                              {course.retakeAttempts.map((attempt, i) => (
                                <div key={i} className="text-xs">
                                  {attempt.grade} ({attempt.marks})
                                </div>
                              ))}
                            </div>
                          ) : 'None'}
                        </td>
                        {/* MODIFICATION START - Displaying marks for Best Grade */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bestGrade.grade === 'F' || bestGrade.grade === 'E'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {bestGrade.grade} ({bestGrade.marks}) - {bestGrade.type}
                          </span>
                        </td>
                        {/* MODIFICATION END */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.credits}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentTranscript;