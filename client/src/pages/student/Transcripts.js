import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const StudentTranscript = () => {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useContext(AuthContext);

  // Retake policy constants for the student's own transcript view
  const MAX_RETAKES_PER_COURSE_ATTEMPTS = 2; // Original + 2 retakes = 3 total attempts per course
  const MAX_TOTAL_RETAKES = 3;             // Total retake attempts across ALL courses
  const MAX_COURSES_WITH_RETAKES = 3;      // Max different courses that can have retakes

  useEffect(() => {
    const fetchTranscript = async () => {
      setLoading(true);
      if (!token) {
        toast.error('Authentication required to view transcript. Please log in.');
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('http://localhost:5000/api/students/transcript', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTranscript(res.data.data);
        setLoading(false);
      } catch (err) {
        let errorMessage = 'Failed to load transcript.';
        if (err.response) {
          errorMessage = err.response.data?.message || `Error: ${err.response.status} ${err.response.statusText}`;
          if (err.response.status === 401 || err.response.status === 403) {
            toast.error('Session expired or unauthorized. Please log in again.');
          }
        } else if (err.request) {
          errorMessage = 'No response from server. Please check your network connection or server status.';
        } else {
          errorMessage = err.message || 'An unknown error occurred during request setup.';
        }
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    if (user && token) {
      fetchTranscript();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const handleDownload = async () => {
    if (!token) {
      toast.error('Authentication required to download transcript. Please log in.');
      return;
    }
    try {
      const response = await axios.get(
        'http://localhost:5000/api/students/transcript/download',
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript_${user?.studentId || 'unknown'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let errorMessage = 'Failed to download transcript.';
      if (err.response) {
        errorMessage = err.response.data?.message || `Error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your network connection or server status.';
      } else {
        errorMessage = err.message || 'An unknown error occurred during request setup.';
      }
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-lg font-medium text-gray-700">Loading transcript...</div>;
  }

  if (!transcript) {
    return (
      <div className="text-center py-12 bg-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-red-600 font-semibold mb-6">Transcript not available or you are not authorized.</p>
      </div>
    );
  }

  // Calculate total retake attempts
  const retakeCount = transcript.courses.reduce((count, yearGroup) => {
    return count + yearGroup.courses.reduce((yearCount, course) => {
      return yearCount + (course.retakeAttempts?.length || 0);
    }, 0);
  }, 0);

  // Calculate number of different courses with retakes
  const coursesWithRetakes = transcript.courses.reduce((uniqueCourses, yearGroup) => {
    yearGroup.courses.forEach(course => {
      if (course.retakeAttempts && course.retakeAttempts.length > 0) {
        // Assuming course.code is unique for different courses
        uniqueCourses.add(course.code);
      }
    });
    return uniqueCourses;
  }, new Set()).size;

  // Check retake policy violations
  const exceededMaxRetakesPerCourse = transcript.courses.some(yearGroup =>
    yearGroup.courses.some(course =>
      (course.retakeAttempts?.length || 0) > MAX_RETAKES_PER_COURSE_ATTEMPTS
    )
  );

  const exceededTotalRetakeAttempts = retakeCount >= MAX_TOTAL_RETAKES;
  const exceededTotalCoursesWithRetakes = coursesWithRetakes >= MAX_COURSES_WITH_RETAKES;

  // Determine if the student can continue based on all policies
  const canContinueStudy = !exceededMaxRetakesPerCourse && !exceededTotalRetakeAttempts && !exceededTotalCoursesWithRetakes;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white shadow-xl rounded-lg p-6">
        <div className="border-b border-gray-200 pb-5 mb-6 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 tracking-tight">
              My Academic Transcript
            </h1>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-5 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Download Transcript (PDF)
            </button>
          </div>
        </div>

        {/* --- Red Important Notice --- */}
        {!canContinueStudy && (
          <div className="mb-8 p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md" role="alert">
            <p className="font-bold text-lg">Important Notice: Policy Violation</p>
            <p className="mt-2 text-base">
              You have violated one or more University of Rwanda retake policies:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {exceededMaxRetakesPerCourse && (
                <li>Exceeded maximum of **{MAX_RETAKES_PER_COURSE_ATTEMPTS}** retakes in one or more courses (original + {MAX_RETAKES_PER_COURSE_ATTEMPTS} retakes allowed).</li>
              )}
              {exceededTotalRetakeAttempts && (
                <li>Exceeded total allowed retake attempts (**{retakeCount}** attempts, limit is {MAX_TOTAL_RETAKES}).</li>
              )}
              {exceededTotalCoursesWithRetakes && (
                <li>Exceeded maximum of **{MAX_COURSES_WITH_RETAKES}** different courses with retake attempts (**{coursesWithRetakes}** courses).</li>
              )}
            </ul>
            <p className="mt-3 font-semibold">
              You are **no longer eligible to continue your studies** at the University.
            </p>
          </div>
        )}

        {/* --- Blue Informational Notice (only if no red notice is shown but retakes exist) --- */}
        {retakeCount > 0 && canContinueStudy && (
          <div className="mb-8 p-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded-lg shadow-md">
            <p className="font-bold text-lg">Retake Information:</p>
            <p className="mt-2 text-base">
              You have **{retakeCount}** total retake attempts across **{coursesWithRetakes}** different courses.
            </p>
            <p className="mt-2 text-base">
              University policy allows maximum **{MAX_RETAKES_PER_COURSE_ATTEMPTS}** retakes per course (original + {MAX_RETAKES_PER_COURSE_ATTEMPTS} retakes), a total of **{MAX_TOTAL_RETAKES}** retakes across all courses, and retakes in a maximum of **{MAX_COURSES_WITH_RETAKES}** different courses.
            </p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden rounded-lg mb-8 p-6 border border-gray-200">
          <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4">
            Student Information
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-base text-gray-900">
                <strong>{transcript.student.firstName} {transcript.student.lastName}</strong>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Student ID</dt>
              <dd className="mt-1 text-base text-gray-900">
                <strong>{transcript.student.studentId}</strong>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Program</dt>
              <dd className="mt-1 text-base text-gray-900">
                <strong>{transcript.student.program || 'N/A'}</strong>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-base text-gray-900">
                <strong>{transcript.student.department || 'N/A'}</strong>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Cumulative GPA</dt>
              <dd className="mt-1 text-base font-bold text-blue-700">
                <strong>{transcript.student.gpa ? transcript.student.gpa.toFixed(2) : 'N/A'}</strong>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Retake Attempts</dt>
              <dd className="mt-1 text-base font-bold text-gray-900">
                <strong>{retakeCount}</strong>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Courses with Retakes</dt>
              <dd className="mt-1 text-base font-bold text-gray-900">
                <strong>{coursesWithRetakes}</strong>
              </dd>
            </div>
          </dl>
        </div>

        {transcript.courses.map((yearGroup, yearIndex) => (
          <div key={yearIndex} className="mt-8 bg-white shadow overflow-hidden rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold leading-tight text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Academic Year: {yearGroup.year}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Course Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Original Grade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Original Marks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Retake Attempts
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Best Grade (Marks)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                      Credits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {yearGroup.courses.map((course, courseIndex) => {
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

                    let bestGrade = { grade: 'N/A', marks: -1, type: '' };
                    const gradePoints = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0, 'N/A': -1 };

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

                    let displayMarks = bestGrade.marks;
                    if (bestGrade.type === 'Retake' && bestGrade.marks > 50) {
                      displayMarks = 50;
                    }

                    // Determine if an individual course has too many retakes
                    const individualCourseExceededRetakes = (course.retakeAttempts?.length || 0) > MAX_RETAKES_PER_COURSE_ATTEMPTS;


                    return (
                      <tr key={courseIndex} className={
                        individualCourseExceededRetakes ? 'bg-red-100 hover:bg-red-200' :
                        (course.retakeAttempts?.length > 0 ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50')
                      }>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 border border-gray-300">
                          <strong>{course.code}</strong>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                          {course.name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          course.originalGrade === 'F' || course.originalGrade === 'E'
                            ? 'text-red-600'
                            : 'text-green-700'
                        } border border-gray-300`}>
                          {course.originalGrade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                          {course.originalMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                          {course.retakeAttempts?.length > 0 ? (
                            <div className="space-y-1">
                              {course.retakeAttempts.map((attempt, i) => (
                                <div key={i} className="text-xs">
                                  {attempt.grade} ({attempt.marks}) - {attempt.semesterTaken} {attempt.yearTaken}
                                </div>
                              ))}
                            </div>
                          ) : 'None'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                          bestGrade.grade === 'F' || bestGrade.grade === 'E'
                            ? 'text-red-600'
                            : 'text-green-700'
                        } border border-gray-300`}>
                          {bestGrade.grade} ({displayMarks}) - {bestGrade.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
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
        <div className="px-4 py-4 sm:px-6 bg-blue-50 text-right rounded-lg shadow-inner mt-6">
          <p className="text-xl font-bold text-blue-800">
            Overall GPA: <strong>{transcript.student.gpa ? transcript.student.gpa.toFixed(2) : 'N/A'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentTranscript;