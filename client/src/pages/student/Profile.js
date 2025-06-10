import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const StudentProfile = () => {
  const { user, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [remainingCourses, setRemainingCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    department: '',
    program: '',
    enrollmentYear: ''
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);

      if (!token || !user || user.role !== 'student') {
        toast.error('Authentication required or unauthorized access. Please log in as a student.');
        setLoading(false);
        return;
      }

      try {
        const profileRes = await axios.get('http://localhost:5000/api/students/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile(profileRes.data.data);
        setFormData({
          firstName: profileRes.data.data.firstName,
          lastName: profileRes.data.data.lastName,
          studentId: profileRes.data.data.studentId,
          department: profileRes.data.data.department,
          program: profileRes.data.data.program,
          enrollmentYear: profileRes.data.data.enrollmentYear
        });

        const remainingCoursesRes = await axios.get(
          `http://localhost:5000/api/students/remaining-courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRemainingCourses(remainingCoursesRes.data.data);
        setLoading(false);
      } catch (err) {
        let errorMessage = err.response?.data?.message || 'Failed to fetch profile and course data.';
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          errorMessage = 'Session expired or unauthorized. Please log in again.';
        }
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [token, user]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('No authentication token available for update.');
      return;
    }
    try {
      await axios.put('http://localhost:5000/api/students/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedProfileRes = await axios.get('http://localhost:5000/api/students/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(updatedProfileRes.data.data);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-medium text-gray-700">Loading profile and academic progress...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-medium text-gray-700">
          No profile data found. This might indicate an issue with your student record or permissions.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-extrabold text-gray-900">Student Profile</h1>
            {!editMode && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Personal Information */}
          <section aria-labelledby="personal-information-heading">
            <h2 id="personal-information-heading" className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
              Personal Information
            </h2>
            {editMode ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={onChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={onChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Student ID</label>
                    <input
                      type="text"
                      name="studentId"
                      id="studentId"
                      value={formData.studentId}
                      onChange={onChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      name="department"
                      id="department"
                      value={formData.department}
                      onChange={onChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="program" className="block text-sm font-medium text-gray-700">Program</label>
                    <input
                      type="text"
                      name="program"
                      id="program"
                      value={formData.program}
                      onChange={onChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="enrollmentYear" className="block text-sm font-medium text-gray-700">Enrollment Year</label>
                    <input
                      type="number"
                      name="enrollmentYear"
                      id="enrollmentYear"
                      value={formData.enrollmentYear}
                      onChange={onChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="divide-y divide-gray-200">
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.firstName} {profile.lastName}</dd>
                </div>
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.studentId}</dd>
                </div>
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.userId.email}</dd>
                </div>
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.department}</dd>
                </div>
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Program</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.program}</dd>
                </div>
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Enrollment Year</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.enrollmentYear}</dd>
                </div>
                <div className="py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">GPA</dt>
                  <dd className="mt-1 text-sm text-gray-900 col-span-2">{profile.gpa ? profile.gpa.toFixed(2) : 'N/A'}</dd>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* --- Academic Progress (Completed Courses) --- */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Academic Progress (Completed Courses)</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              {profile.courses && profile.courses.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester Taken
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year Taken
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retake
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profile.courses.map((studentCourse, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {studentCourse.course?.code || studentCourse.courseCode || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {studentCourse.course?.name || studentCourse.courseName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            studentCourse.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {studentCourse.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentCourse.course?.credits || studentCourse.credits || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentCourse.semesterTaken || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentCourse.yearTaken || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentCourse.isRetake ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-4">No academic progress records available.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Remaining Courses Section --- */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Remaining Courses (Eligible to Take)</h2>
          </div>
          <div className="p-6">
            {remainingCourses && remainingCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Suggested Semester
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Suggested Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {remainingCourses.map((course, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.code || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.credits || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.semester || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.year || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No remaining courses found or all program courses completed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;