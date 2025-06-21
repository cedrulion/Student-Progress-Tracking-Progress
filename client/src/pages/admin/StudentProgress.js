import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentProgress = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [courses, setCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [formData, setFormData] = useState({
        courseId: '',
        semesterTaken: 'Semester 1',
        yearTaken: new Date().getFullYear(),
        grade: 'A',
        marks: 0,
        isRetake: false
    });
    const [formErrors, setFormErrors] = useState({});
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentRes, studentCoursesRes, allCoursesRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
                    axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`),
                    axios.get(`http://localhost:5000/api/admin/courses`)
                ]);
                setStudent(studentRes.data.data);
                setCourses(studentCoursesRes.data.data);
                setAvailableCourses(allCoursesRes.data.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                toast.error(err.response?.data?.message || 'Failed to load student data.');
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
        setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.courseId) errors.courseId = 'Please select a course.';
        if (!formData.semesterTaken) errors.semesterTaken = 'Semester is required.';
        if (!formData.yearTaken) errors.yearTaken = 'Year taken is required.';
        if (!formData.grade) errors.grade = 'Grade is required.';
        if (!formData.marks) errors.marks = 'Marks are required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            courseId: formData.courseId,
            semesterTaken: formData.semesterTaken,
            yearTaken: formData.yearTaken,
            grade: formData.grade,
            marks: formData.marks,
            isRetake: formData.isRetake
        };
        console.log('Sending payload:', payload);
        try {
            if (editingCourseId) {
                await axios.put(
                    `http://localhost:5000/api/admin/students/${studentId}/courses/${editingCourseId}`,
                    payload
                );
                toast.success('Course assignment updated successfully!');
            } else {
                await axios.post(
                    `http://localhost:5000/api/admin/students/${studentId}/assign-course`,
                    payload
                );
                toast.success('Course assigned successfully!');
            }

            const [updatedStudentRes, updatedCoursesRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
                axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`)
            ]);
            setStudent(updatedStudentRes.data.data);
            setCourses(updatedCoursesRes.data.data);

            cancelEdit();
        } catch (err) {
            console.error('Failed to save course assignment:', err);
            toast.error(err.response?.data?.message || 'Failed to save course assignment. Please try again.');
        }
    };

    const handleEdit = (studentCourse) => {
        setEditingCourseId(studentCourse._id);
        setFormData({
            courseId: studentCourse.course ? studentCourse.course._id : '',
            semesterTaken: studentCourse.semesterTaken,
            yearTaken: studentCourse.yearTaken,
            grade: studentCourse.grade,
            marks: studentCourse.marks,
            isRetake: studentCourse.isRetake
        });
        setFormErrors({});
        document.getElementById('course-form').scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (studentCourseId) => {
        if (!window.confirm('Are you sure you want to delete this course assignment? This cannot be undone.')) {
            return;
        }
        try {
            await axios.delete(
                `http://localhost:5000/api/admin/students/${studentId}/courses/${studentCourseId}`
            );
            toast.success('Course assignment deleted successfully!');
            const [updatedStudentRes, updatedCoursesRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
                axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`)
            ]);
            setStudent(updatedStudentRes.data.data);
            setCourses(updatedCoursesRes.data.data);
        } catch (err) {
            console.error('Failed to delete course assignment:', err);
            toast.error(err.response?.data?.message || 'Failed to delete course assignment. Please try again.');
        }
    };

    const cancelEdit = () => {
        setEditingCourseId(null);
        setFormData({
            courseId: '',
            semesterTaken: 'Semester 1',
            yearTaken: new Date().getFullYear(),
            grade: 'A',
            marks: 0,
            isRetake: false
        });
        setFormErrors({});
    };

    const handleSortByYear = () => {
        const sortedCourses = [...courses].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.yearTaken - b.yearTaken;
            } else {
                return b.yearTaken - a.yearTaken;
            }
        });
        setCourses(sortedCourses);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
                        Student ID: {student.studentId} | Department: {student.department} | GPA: {student.gpa !== undefined ? student.gpa.toFixed(2) : 'N/A'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Course History</h3>
                                <button
                                    onClick={handleSortByYear}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Sort by Year {sortOrder === 'asc' ? '↓' : '↑'}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester Taken</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Taken</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {courses.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No courses assigned yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            courses.map((studentCourse) => (
                                                <tr key={studentCourse._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {studentCourse.course ? studentCourse.course.code : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {studentCourse.course ? studentCourse.course.name : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {studentCourse.course ? studentCourse.course.credits : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {studentCourse.semesterTaken}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {studentCourse.yearTaken}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            studentCourse.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {studentCourse.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {studentCourse.marks}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(studentCourse)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(studentCourse._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="course-form">
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {editingCourseId ? 'Edit Course Assignment' : 'Assign New Course'}
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">
                                                Course
                                            </label>
                                            <select
                                                id="courseId"
                                                name="courseId"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.courseId}
                                                onChange={handleChange}
                                                disabled={editingCourseId !== null}
                                            >
                                                <option value="">Select a Course</option>
                                                {availableCourses.map((course) => (
                                                    <option key={course._id} value={course._id}>
                                                        {course.code} - {course.name} ({course.credits} credits)
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.courseId && <p className="mt-2 text-sm text-red-600">{formErrors.courseId}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="semesterTaken" className="block text-sm font-medium text-gray-700">
                                                    Semester Taken
                                                </label>
                                                <select
                                                    id="semesterTaken"
                                                    name="semesterTaken"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.semesterTaken}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Fall">Semester 1</option>
                                                    <option value="Spring">Semester 2</option>
                                                    <option value="Summer">Semester 3</option>
                                                </select>
                                                {formErrors.semesterTaken && <p className="mt-2 text-sm text-red-600">{formErrors.semesterTaken}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="yearTaken" className="block text-sm font-medium text-gray-700">
                                                    Year Taken (e.g., 2023)
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
                                                {formErrors.yearTaken && <p className="mt-2 text-sm text-red-600">{formErrors.yearTaken}</p>}
                                            </div>
                                        </div>

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
                                                <option value="N/A">N/A</option>
                                            </select>
                                            {formErrors.grade && <p className="mt-2 text-sm text-red-600">{formErrors.grade}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="marks" className="block text-sm font-medium text-gray-700">
                                                Marks
                                            </label>
                                            <input
                                                type="number"
                                                id="marks"
                                                name="marks" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.marks}
                                                onChange={handleChange}
                                            />
                                            {formErrors.marks && <p className="mt-2 text-sm text-red-600">{formErrors.marks}</p>}
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
                                                {editingCourseId ? 'Update Assignment' : 'Assign Course'}
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