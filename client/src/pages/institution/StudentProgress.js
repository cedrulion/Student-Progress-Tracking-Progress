import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const InstitutionStudentProgress = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [remainingCourses, setRemainingCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAllStudentData = async () => {
      setLoading(true);
      if (!token) {
        toast.error('Authentication required to view student progress. Please log in.');
        setLoading(false);
        return;
      }

      if (!user || user.role !== 'institution') {
        toast.error('Unauthorized access. Only institution users can view this page.');
        setLoading(false);
        return;
      }

      try {
        const studentRes = await axios.get(
          `http://localhost:5000/api/institutions/student-progress/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStudent(studentRes.data.data);

        const remainingCoursesRes = await axios.get(
          `http://localhost:5000/api/institutions/students/${studentId}/remaining-courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRemainingCourses(remainingCoursesRes.data.data);
        setLoading(false);
      } catch (err) {
        let errorMessage = 'Failed to fetch student data.';
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

    if (studentId) {
      fetchAllStudentData();
    } else {
      setLoading(false);
      toast.error('Student ID is missing in the URL.');
    }
  }, [studentId, token, user]);

  if (loading) {
    return <div className="text-center py-8 text-lg font-medium text-gray-700">Loading student progress...</div>;
  }

  if (!student) {
    return (
      <div className="text-center py-12 bg-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-red-600 font-semibold mb-6">No student data available or you do not have permission to view this student's progress.</p>
        <Link
          to="/institution/students"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
        >
          Back to Students List
        </Link>
      </div>
    );
  }

  // Calculate total retake attempts across all courses
  const retakeCount = student.courses.reduce((count, course) => count + course.retakeAttempts.length, 0);
  const canContinueStudy = retakeCount < 3;

  // Function to get the best grade for a course (original or retake)
  const getBestGrade = (studentCourse) => {
    const gradePoints = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0, 'N/A': 0 };

    const allGrades = [{
      grade: studentCourse.originalGrade,
      marks: studentCourse.originalMarks,
      type: 'Original',
      yearTaken: studentCourse.originalYearTaken,
      semesterTaken: studentCourse.originalSemesterTaken
    }];

    studentCourse.retakeAttempts.forEach(att => {
      allGrades.push({
        grade: att.grade,
        marks: att.marks,
        type: 'Retake',
        yearTaken: att.yearTaken,
        semesterTaken: att.semesterTaken
      });
    });

    let bestGrade = { grade: 'N/A', marks: -1, type: 'N/A' }; // Initialize type

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
    if (bestGrade.type === 'Retake') {
      return { ...bestGrade, marks: 50 }; // Override marks to 50 for retakes
    }
    // --- MODIFICATION END ---

    return bestGrade;
  };

  // Group courses by year for display
  const coursesByYear = student.courses.reduce((acc, studentCourse) => {
    const year = studentCourse.course?.year || 'N/A';
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(studentCourse);
    return acc;
  }, {});

  const sortedYears = Object.keys(coursesByYear).sort((a, b) => {
    if (a === 'N/A') return 1;
    if (b === 'N/A') return -1;
    return parseInt(a) - parseInt(b);
  });

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white shadow-xl rounded-lg p-6">
        <div className="border-b border-gray-200 pb-5 mb-6 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 tracking-tight">
              Academic Progress: <span className="text-blue-700">{student.firstName} {student.lastName}</span>
            </h1>
            <p className="mt-2 text-md text-gray-600">
              Student ID: <span className="font-semibold text-gray-800">{student.studentId}</span> | Program: <span className="font-semibold text-gray-800">{student.program}</span>
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/institution/students"
              className="inline-flex items-center px-5 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Back to Students
            </Link>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg mb-8 p-6">
          <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4">
            Student Details
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-base text-gray-900"><strong>{student.department}</strong></dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Program</dt>
              <dd className="mt-1 text-base text-gray-900"><strong>{student.program}</strong></dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Enrollment Year</dt>
              <dd className="mt-1 text-base text-gray-900"><strong>{student.enrollmentYear || 'Not specified'}</strong></dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Cumulative GPA</dt>
              <dd className="mt-1 text-base font-bold text-blue-700"><strong>{student.gpa ? student.gpa.toFixed(2) : 'N/A'}</strong></dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Retake Attempts</dt>
              <dd className="mt-1 text-base font-bold text-gray-900"><strong>{retakeCount}</strong></dd>
            </div>
          </dl>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-tight text-gray-900 mb-6">
            Completed Courses
          </h2>
          {student.courses && student.courses.length > 0 ? (
            sortedYears.map(year => (
              <div key={year} className="mb-8 p-6 bg-white shadow rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  {year}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-blue-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                          Course Code
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
                          Current Marks
                        </th> {/* Updated column header */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border border-gray-300">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {coursesByYear[year].map((studentCourse, index) => {
                        const bestGrade = getBestGrade(studentCourse);
                        const hasRetakes = studentCourse.retakeAttempts.length > 0;

                        return (
                          <tr key={index} className={hasRetakes ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 border border-gray-300">
                              <strong>{studentCourse.course ? studentCourse.course.code : 'N/A'}</strong>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                              {studentCourse.course ? studentCourse.course.name : 'N/A'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                              studentCourse.originalGrade === 'F' || studentCourse.originalGrade === 'E' ? 'text-red-600' : 'text-green-700'
                            } border border-gray-300`}>
                              {studentCourse.originalGrade}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                              {studentCourse.originalMarks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                              {studentCourse.retakeAttempts.length > 0 ? (
                                <div className="space-y-1">
                                  {studentCourse.retakeAttempts.map((attempt, i) => (
                                    <div key={i} className="text-xs">
                                      {attempt.grade} ({attempt.marks}) - {attempt.semesterTaken} {attempt.yearTaken}
                                    </div>
                                  ))}
                                </div>
                              ) : 'None'}
                            </td>
                            {/* MODIFICATION START - Displaying marks for Best Grade */}
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                              bestGrade.grade === 'F' || bestGrade.grade === 'E' ? 'text-red-600' : 'text-green-700'
                            } border border-gray-300`}>
                              {bestGrade.grade} ({bestGrade.marks}) - {bestGrade.type}
                            </td>
                            {/* MODIFICATION END */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                              {studentCourse.course ? studentCourse.course.credits : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-600 bg-white rounded-lg shadow">
              No completed course records available for this student.
            </div>
          )}
          <div className="px-4 py-4 sm:px-6 bg-blue-50 text-right rounded-lg shadow-inner mt-6">
            <p className="text-xl font-bold text-blue-800">
              Overall GPA: <strong>{student.gpa ? student.gpa.toFixed(2) : 'N/A'}</strong>
            </p>
          </div>
        </div>

        {!canContinueStudy && (
          <div className="mb-8 p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md" role="alert">
            <p className="font-bold text-lg">Important Notice:</p>
            <p className="mt-2 text-base">
              This student has accumulated <strong>{retakeCount} retakes</strong>, which exceeds the maximum allowed retakes at the University of Rwanda. Consequently, this student is <strong>no longer eligible to continue their studies</strong> at the University.
            </p>
          </div>
        )}

        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold leading-tight text-gray-900 mb-6 pb-2 border-b">
            Remaining Courses (Eligible to Take)
          </h2>
          {remainingCourses && remainingCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-yellow-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider border border-gray-300">
                      Course Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider border border-gray-300">
                      Course Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider border border-gray-300">
                      Credits
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider border border-gray-300">
                      Suggested Semester
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider border border-gray-300">
                      Suggested Year
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {remainingCourses.map((course, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 border border-gray-300">
                        <strong>{course.code}</strong>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                        {course.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                        {course.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                        {course.semester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                        {course.year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-600">
              No remaining courses found or all program courses completed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionStudentProgress;