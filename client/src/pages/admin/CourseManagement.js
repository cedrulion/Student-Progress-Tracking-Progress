import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        semester: '',
        year: '',
        credits: 3,
        prerequisites: [],
        hasNoPrerequisites: false,
    });
    const [allCoursesForPrereq, setAllCoursesForPrereq] = useState([]);

    const semesters = ['Fall', 'Spring', 'Summer'];
    const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];

    useEffect(() => {
        fetchCourses();
        fetchAllCoursesForPrereq();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/courses');
            const sortedCourses = res.data.data.sort((a, b) => {
                const yearA = parseInt(a.year.replace('Year ', ''), 10);
                const yearB = parseInt(b.year.replace('Year ', ''), 10);
                return yearA - yearB;
            });
            setCourses(sortedCourses);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
            toast.error(err.response?.data?.error || 'Failed to load courses.');
            setLoading(false);
        }
    };

    const fetchAllCoursesForPrereq = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/courses');
            setAllCoursesForPrereq(res.data.data);
        } catch (err) {
            console.error('Failed to fetch all courses for prerequisites:', err);
            toast.error(err.response?.data?.error || 'Failed to load prerequisite options.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handlePrerequisiteCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prevFormData => {
            let updatedPrerequisites;
            if (checked) {
                updatedPrerequisites = [...prevFormData.prerequisites, value];
            } else {
                updatedPrerequisites = prevFormData.prerequisites.filter(
                    (prereqId) => prereqId !== value
                );
            }
            return {
                ...prevFormData,
                prerequisites: updatedPrerequisites,
                hasNoPrerequisites: false,
            };
        });
    };

    const handleNoPrerequisitesChange = (e) => {
        const { checked } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            hasNoPrerequisites: checked,
            prerequisites: checked ? [] : prevFormData.prerequisites,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formData,
                prerequisites: formData.hasNoPrerequisites ? [] : formData.prerequisites,
            };

            if (editingCourseId) {
                await axios.put(`http://localhost:5000/api/admin/courses/${editingCourseId}`, dataToSubmit);
                setEditingCourseId(null);
                toast.success('Course updated successfully!');
            } else {
                await axios.post('http://localhost:5000/api/admin/courses', dataToSubmit);
                toast.success('Course added successfully!');
            }
            fetchCourses();
            fetchAllCoursesForPrereq();
            setFormData({ code: '', name: '', semester: '', year: '', credits: 3, prerequisites: [], hasNoPrerequisites: false });
        } catch (err) {
            console.error('Failed to save course:', err.response ? err.response.data.error : err.message);
            toast.error(`Error: ${err.response ? err.response.data.error : err.message}`);
        }
    };

    const handleEdit = (course) => {
        setEditingCourseId(course._id);
        setFormData({
            code: course.code,
            name: course.name,
            semester: course.semester,
            year: course.year,
            credits: course.credits,
            prerequisites: course.prerequisites.map(p => p._id),
            hasNoPrerequisites: course.prerequisites.length === 0,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        try {
            await axios.delete(`http://localhost:5000/api/admin/courses/${courseId}`);
            fetchCourses();
            fetchAllCoursesForPrereq();
            toast.success('Course deleted successfully!');
        } catch (err) {
            console.error('Failed to delete course:', err.response ? err.response.data.error : err.message);
            toast.error(`Error: ${err.response ? err.response.data.error : err.message}`);
        }
    };

    const cancelEdit = () => {
        setEditingCourseId(null);
        setFormData({ code: '', name: '', semester: '', year: '', credits: 3, prerequisites: [], hasNoPrerequisites: false });
    };

    if (loading) {
        return <div className="text-center py-8">Loading courses...</div>;
    }

    return (
        <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Catalog Management</h1>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {editingCourseId ? 'Edit Course Details' : 'Add New Course to Catalog'}
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
                                        Course Title
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
                                <div>
                                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                                        Offered Semester
                                    </label>
                                    <select
                                        id="semester"
                                        name="semester"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={formData.semester}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Semester</option>
                                        {semesters.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                                        Offered Year (Curriculum)
                                    </label>
                                    <select
                                        id="year"
                                        name="year"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={formData.year}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prerequisites
                                    </label>
                                    <div className="mt-1 border border-gray-300 rounded-md shadow-sm p-3 max-h-48 overflow-y-auto">
                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                                            <input
                                                type="checkbox"
                                                id="hasNoPrerequisites"
                                                name="hasNoPrerequisites"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={formData.hasNoPrerequisites}
                                                onChange={handleNoPrerequisitesChange}
                                            />
                                            <label htmlFor="hasNoPrerequisites" className="ml-2 block text-sm font-medium text-gray-700">
                                                No Prerequisites
                                            </label>
                                        </div>
                                        <div>
                                            {allCoursesForPrereq
                                                .filter(course => editingCourseId !== course._id)
                                                .map((course) => (
                                                    <div key={course._id} className="flex items-center mb-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`prereq-${course._id}`}
                                                            value={course._id}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            checked={formData.prerequisites.includes(course._id)}
                                                            onChange={handlePrerequisiteCheckboxChange}
                                                            disabled={formData.hasNoPrerequisites}
                                                        />
                                                        <label htmlFor={`prereq-${course._id}`} className="ml-2 block text-sm text-gray-700">
                                                            {course.code} - {course.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            {allCoursesForPrereq.filter(course => editingCourseId !== course._id).length === 0 && !formData.hasNoPrerequisites && (
                                                <p className="text-sm text-gray-500 italic">No other courses available to select as prerequisites.</p>
                                            )}
                                        </div>
                                    </div>
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

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Current Course Catalog</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prerequisites</th>
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
                                            {course.year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {course.credits}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {course.prerequisites && course.prerequisites.length > 0
                                                ? course.prerequisites.map(p => p.code).join(', ')
                                                : 'None'}
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
        </div>
    );
};

export default CourseManagement;