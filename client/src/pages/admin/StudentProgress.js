import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentProgress = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester: 1,
    yearTaken: new Date().getFullYear(),
    grade: 'A',
    credits: 3,
    isRetake: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, coursesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
          axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`)
        ]);
        setStudent(studentRes.data.data);
        setCourses(coursesRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        // Update existing course
        await axios.put(
          `http://localhost:5000/api/admin/students/${studentId}/courses/${editingCourseId}`,
          formData
        );
        setEditingCourseId(null);
      } else {
        // Add new course
        await axios.post(
          `http://localhost:5000/api/admin/students/${studentId}/courses`, 
          formData
        );
      }
      
      // Refresh course list
      const res = await axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`);
      setCourses(res.data.data);
      
      // Reset form
      setFormData({
        code: '',
        name: '',
        semester: 1,
        yearTaken: new Date().getFullYear(),
        grade: 'A',
        credits: 3,
        isRetake: false
      });
    } catch (err) {
      console.error('Failed to save course:', err);
    }
  };

  const handleEdit = (course) => {
    setEditingCourseId(course._id);
    setFormData({
      code: course.code,
      name: course.name,
      semester: course.semester,
      yearTaken: course.yearTaken,
      grade: course.grade,
      credits: course.credits,
      isRetake: course.isRetake
    });
    // Scroll to form
    document.getElementById('course-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (courseId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/students/${studentId}/courses/${courseId}`
      );
      const res = await axios.get(
        `http://localhost:5000/api/admin/students/${studentId}/courses`
      );
      setCourses(res.data.data);
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const cancelEdit = () => {
    setEditingCourseId(null);
    setFormData({
      code: '',
      name: '',
      semester: 1,
      yearTaken: new Date().getFullYear(),
      grade: 'A',
      credits: 3,
      isRetake: false
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading student data...</div>;
  }

  if (!student) {
    return <div className="text-center py-8">Student not found</div>;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {student.firstName} {student.lastName}'s Academic Progress
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Student ID: {student.studentId} | Department: {student.department} | GPA: {student.gpa.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Course History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.yearTaken}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {course.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="course-form">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingCourseId ? 'Edit Course' : 'Add New Course'}
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        Course Code
                      </label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.code}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Course Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                          Semester
                        </label>
                        <select
                          id="semester"
                          name="semester"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formData.semester}
                          onChange={handleChange}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="yearTaken" className="block text-sm font-medium text-gray-700">
                          Year Taken
                        </label>
                        <input
                          type="number"
                          id="yearTaken"
                          name="yearTaken"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formData.yearTaken}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                          Grade
                        </label>
                        <select
                          id="grade"
                          name="grade"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formData.grade}
                          onChange={handleChange}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="F">F</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                          Credits
                        </label>
                        <input
                          type="number"
                          id="credits"
                          name="credits"
                          min="1"
                          max="10"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formData.credits}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="isRetake"
                        name="isRetake"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.isRetake}
                        onChange={handleChange}
                      />
                      <label htmlFor="isRetake" className="ml-2 block text-sm text-gray-700">
                        Is this a retake?
                      </label>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {editingCourseId ? 'Update Course' : 'Add Course'}
                      </button>
                      {editingCourseId && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;