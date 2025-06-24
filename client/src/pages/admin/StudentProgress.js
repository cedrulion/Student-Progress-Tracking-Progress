import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentProgress = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // State for student details and their assigned courses
    const [student, setStudent] = useState(null);
    const [courses, setCourses] = useState([]); // Courses assigned to this student, including retakeAttempts
    const [availableCourses, setAvailableCourses] = useState([]); // All courses in the system (for dropdown)

    // UI states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false); // For form submission
    const [editingCourseId, setEditingCourseId] = useState(null); // ID of the studentCourse (original attempt) being edited
    const [expandedRows, setExpandedRows] = useState({}); // State for controlling collapsible retake rows

    // Form data state for assigning/editing courses
    const [formData, setFormData] = useState({
        courseId: '',
        semesterTaken: 'Semester 1',
        yearTaken: new Date().getFullYear(),
        grade: 'A',
        marks: 0,
        isRetake: false
    });
    const [formErrors, setFormErrors] = useState({});

    // Table sorting state
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc' for year sorting

    /**
     * useEffect hook to fetch initial data:
     * - Student details
     * - Courses assigned to the student
     * - All available courses in the system
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentRes, studentCoursesRes, allCoursesRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
                    axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`),
                    axios.get(`http://localhost:5000/api/admin/courses`)
                ]);

                setStudent(studentRes.data.data);
                // Sort courses by yearTaken for consistent display
                const sortedStudentCourses = studentCoursesRes.data.data.sort((a, b) => a.originalYearTaken - b.originalYearTaken);
                setCourses(sortedStudentCourses);
                setAvailableCourses(allCoursesRes.data.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                toast.error(err.response?.data?.message || 'Failed to load student data. Please try again.');
                // Optionally navigate back or show a full-page error
                // navigate('/admin/students');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId, navigate]); // Add navigate to dependency array as it's used in useEffect

    /**
     * Filters available courses for the dropdown based on 'isRetake' status and
     * whether the course has already been taken by the student.
     */
    const coursesForDropdown = useMemo(() => {
        const assignedOriginalCourseIds = new Set(courses.map(sc => sc.course?._id.toString()));

        if (editingCourseId) {
            // When editing an existing original course, allow selection of all courses
            // (though typically courseId might be disabled when editing a specific assignment).
            // For now, we allow selecting any course when editing to give flexibility,
            // but the `disabled` attribute on the select input will prevent changing.
            return availableCourses;
        } else if (formData.isRetake) {
            // If it's a retake, only show courses the student has already taken (original attempt)
            return availableCourses.filter(course => assignedOriginalCourseIds.has(course._id.toString()));
        } else {
            // If it's a new original assignment, only show courses the student has NOT yet taken
            return availableCourses.filter(course => !assignedOriginalCourseIds.has(course._id.toString()));
        }
    }, [availableCourses, courses, editingCourseId, formData.isRetake]);


    /**
     * Handles changes to form input fields.
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        // Clear specific error message when the user starts typing/changing
        setFormErrors(prev => ({ ...prev, [name]: '' }));

        // Special handling for 'isRetake' checkbox
        if (name === 'isRetake') {
            // Reset courseId when toggling isRetake to force re-selection from filtered list
            setFormData(prev => ({
                ...prev,
                courseId: '',
                isRetake: newValue
            }));
            setFormErrors(prev => ({ ...prev, courseId: '' }));
        }
    };

    /**
     * Validates the form data before submission.
     * @returns {boolean} True if the form is valid, false otherwise.
     */
    const validateForm = () => {
        const errors = {};
        if (!formData.courseId) errors.courseId = 'Please select a course.';
        if (!formData.semesterTaken) errors.semesterTaken = 'Semester is required.';
        if (!formData.yearTaken || formData.yearTaken < 1900 || formData.yearTaken > new Date().getFullYear() + 5) {
            errors.yearTaken = 'Please enter a valid year (e.g., 1900 - ' + (new Date().getFullYear() + 5) + ').';
        }
        if (!formData.grade) errors.grade = 'Grade is required.';
        if (formData.marks === '' || formData.marks === null || isNaN(formData.marks)) {
            errors.marks = 'Marks are required.';
        } else if (formData.marks < 0 || formData.marks > 100) {
            errors.marks = 'Marks must be between 0 and 100.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Handles form submission for both adding and updating course assignments.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please correct the errors in the form.');
            return;
        }

        setSubmitting(true);
        const payload = {
            courseId: formData.courseId,
            semesterTaken: formData.semesterTaken,
            yearTaken: parseInt(formData.yearTaken, 10), // Ensure year is a number
            grade: formData.grade,
            marks: parseInt(formData.marks, 10), // Ensure marks is a number
            isRetake: formData.isRetake // This flag tells the backend how to process
        };

        try {
            if (editingCourseId) {
                // If editing, we assume we are updating the ORIGINAL attempt details
                // Retake attempts are added/managed via the "Assign New Course" form with isRetake checked
                const originalStudentCourse = courses.find(sc => sc._id === editingCourseId);
                if (!originalStudentCourse) {
                    toast.error('Original course record not found for editing.');
                    return;
                }
                // Only update fields relevant to the original attempt
                const updatePayload = {
                    originalMarks: payload.marks,
                    originalGrade: payload.grade,
                    originalYearTaken: payload.yearTaken,
                    originalSemesterTaken: payload.semesterTaken,
                    // Note: isRetake flag from form is not used here for updating original
                    // The backend handles the 'isRetake' logic for adding *new* retakes.
                    // This update is specific to the original attempt's details.
                };

                await axios.put(
                    `http://localhost:5000/api/admin/students/${studentId}/courses/${editingCourseId}`,
                    updatePayload // Send only relevant original fields
                );
                toast.success('Original course assignment updated successfully!');
            } else {
                // Assigning a new course or a new retake attempt
                await axios.post(
                    `http://localhost:5000/api/admin/students/${studentId}/assign-course`,
                    payload
                );
                toast.success(formData.isRetake ? 'Retake attempt assigned successfully!' : 'Course assigned successfully!');
            }

            // Re-fetch student and course data to update the UI with latest changes including GPA
            const [updatedStudentRes, updatedCoursesRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
                axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`)
            ]);
            setStudent(updatedStudentRes.data.data);
            const sortedStudentCourses = updatedCoursesRes.data.data.sort((a, b) => a.originalYearTaken - b.originalYearTaken);
            setCourses(sortedStudentCourses);

            cancelEdit(); // Reset form and editing state
        } catch (err) {
            console.error('Failed to save course assignment:', err);
            toast.error(err.response?.data?.message || 'Failed to save course assignment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Populates the form with data of the original course assignment to be edited.
     * Scrolls the form into view.
     */
    const handleEdit = (studentCourse) => {
        setEditingCourseId(studentCourse._id);
        setFormData({
            courseId: studentCourse.course ? studentCourse.course._id : '',
            semesterTaken: studentCourse.originalSemesterTaken,
            yearTaken: studentCourse.originalYearTaken,
            grade: studentCourse.originalGrade,
            marks: studentCourse.originalMarks,
            isRetake: false // When editing original, checkbox should not be checked
        });
        setFormErrors({}); // Clear any previous form errors
        document.getElementById('course-form').scrollIntoView({ behavior: 'smooth' });
    };

    /**
     * Handles deletion of an entire course assignment (original + all retakes).
     */
    const handleDelete = async (studentCourseId) => {
        if (!window.confirm('Are you sure you want to delete this entire course record (original attempt and all retakes)? This cannot be undone and will affect GPA calculation.')) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:5000/api/admin/students/${studentId}/courses/${studentCourseId}`
            );
            toast.success('Course record deleted successfully!');

            // Re-fetch student and course data to update the UI with latest changes including GPA
            const [updatedStudentRes, updatedCoursesRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/admin/students/${studentId}`),
                axios.get(`http://localhost:5000/api/admin/students/${studentId}/courses`)
            ]);
            setStudent(updatedStudentRes.data.data);
            const sortedStudentCourses = updatedCoursesRes.data.data.sort((a, b) => a.originalYearTaken - b.originalYearTaken);
            setCourses(sortedStudentCourses);
        } catch (err) {
            console.error('Failed to delete course assignment:', err);
            toast.error(err.response?.data?.message || 'Failed to delete course assignment. Please try again.');
        }
    };

    /**
     * Resets the form and clears the editing state.
     */
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
        setFormErrors({}); // Clear form errors on cancel
    };

    /**
     * Toggles the visibility of retake attempts for a specific course.
     */
    const toggleRetakes = (courseId) => {
        setExpandedRows(prev => ({
            ...prev,
            [courseId]: !prev[courseId]
        }));
    };

    /**
     * Toggles the sort order of courses by year taken.
     */
    const handleSortByYear = () => {
        const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        const sortedCourses = [...courses].sort((a, b) => {
            // Sort by originalYearTaken for consistency
            if (newSortOrder === 'asc') {
                return a.originalYearTaken - b.originalYearTaken;
            } else {
                return b.originalYearTaken - a.originalYearTaken;
            }
        });
        setCourses(sortedCourses);
        setSortOrder(newSortOrder);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Loading student academic progress...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-red-600">Error: Student not found or data could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="py-6 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8 bg-white shadow-md rounded-lg p-6"> {/* Changed to shadow-md */}
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        {student.firstName} {student.lastName}'s Academic Progress
                    </h1>
                    <p className="mt-1 text-md text-gray-600">
                        <span className="font-semibold">Student ID:</span> {student.studentId} |{' '}
                        <span className="font-semibold">Department:</span> {student.department} |{' '}
                        <span className="font-semibold">Current GPA:</span> {student.gpa !== undefined ? parseFloat(student.gpa).toFixed(2) : 'N/A'}
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        &larr; Back to Students
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Course History Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-md overflow-hidden sm:rounded-lg"> {/* Changed to shadow-md */}
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <h3 className="text-xl leading-6 font-bold text-gray-900">Course History</h3>
                                <button
                                    onClick={handleSortByYear}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    Sort by Year {sortOrder === 'asc' ? '↓' : '↑'}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Semester</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Year</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Grade</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Marks</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retakes</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {courses.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="px-6 py-8 text-center text-sm text-gray-500">
                                                    No courses assigned to this student yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            courses.map((studentCourse) => (
                                                <>
                                                    <tr key={studentCourse._id} className="hover:bg-gray-50 transition-colors duration-150">
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
                                                            {studentCourse.originalSemesterTaken}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {studentCourse.originalYearTaken}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                studentCourse.originalGrade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {studentCourse.originalGrade}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {studentCourse.originalMarks}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {studentCourse.retakeAttempts.length > 0 ? (
                                                                <button
                                                                    onClick={() => toggleRetakes(studentCourse._id)}
                                                                    className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                                                >
                                                                    {studentCourse.retakeAttempts.length} Retakes {expandedRows[studentCourse._id] ? '▲' : '▼'}
                                                                </button>
                                                            ) : 'No'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(studentCourse)}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                                                            >
                                                                Edit Original
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(studentCourse._id)}
                                                                className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {/* Retake Attempts Rows (conditionally rendered) */}
                                                    {expandedRows[studentCourse._id] && studentCourse.retakeAttempts.map((retake, index) => (
                                                        <tr key={`${studentCourse._id}-retake-${index}`} className="bg-gray-50 border-t border-gray-200">
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic"></td> {/* Empty for alignment */}
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic"></td>
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic"></td>
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic">Retake ({retake.semesterTaken})</td>
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic">{retake.yearTaken}</td>
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    retake.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800' // Yellow for retake grades
                                                                }`}>
                                                                    {retake.grade}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic">{retake.marks}</td>
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 italic"></td> {/* Empty */}
                                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                                                                {/* Potential: Add edit/delete for individual retakes here if needed */}
                                                                <span className="text-gray-400"> (Retake)</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Assign/Edit Course Form Section */}
                    <div id="course-form">
                        <div className="bg-white shadow-md overflow-hidden sm:rounded-lg"> {/* Changed to shadow-md */}
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-xl leading-6 font-bold text-gray-900">
                                    {editingCourseId ? 'Edit Original Course Assignment' : 'Assign New Course / Retake'}
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-6"> {/* Increased spacing */}
                                        <div>
                                            <label htmlFor="isRetake" className="flex items-center text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                                                <input
                                                    id="isRetake"
                                                    name="isRetake"
                                                    type="checkbox"
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                                                    checked={formData.isRetake}
                                                    onChange={handleChange}
                                                    disabled={editingCourseId !== null} // Disable checkbox when editing an original course
                                                />
                                                Is this a retake? (Select this if the student is re-taking an existing course)
                                            </label>
                                        </div>

                                        <div>
                                            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">
                                                Course
                                            </label>
                                            <select
                                                id="courseId"
                                                name="courseId"
                                                required
                                                className={`mt-1 block w-full border ${formErrors.courseId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                value={formData.courseId}
                                                onChange={handleChange}
                                                disabled={editingCourseId !== null} // Disable course selection when editing original
                                            >
                                                <option value="">Select a Course</option>
                                                {coursesForDropdown.map((course) => (
                                                    <option key={course._id} value={course._id}>
                                                        {course.code} - {course.name} ({course.credits} credits)
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.courseId && <p className="mt-2 text-sm text-red-600">{formErrors.courseId}</p>}
                                            {!editingCourseId && formData.isRetake && coursesForDropdown.length === 0 && (
                                                <p className="mt-2 text-sm text-yellow-600">No courses available for retake. Student might not have taken any courses yet or already passed them.</p>
                                            )}
                                             {!editingCourseId && !formData.isRetake && coursesForDropdown.length === 0 && (
                                                <p className="mt-2 text-sm text-yellow-600">All courses have been assigned to this student. Cannot add new original courses.</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="semesterTaken" className="block text-sm font-medium text-gray-700">
                                                    Semester Taken
                                                </label>
                                                <select
                                                    id="semesterTaken"
                                                    name="semesterTaken"
                                                    required
                                                    className={`mt-1 block w-full border ${formErrors.semesterTaken ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                    value={formData.semesterTaken}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Semester 1">Semester 1</option>
                                                    <option value="Semester 2">Semester 2</option>
                                                    <option value="Semester 3">Semester 3</option>
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
                                                    className={`mt-1 block w-full border ${formErrors.yearTaken ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                    value={formData.yearTaken}
                                                    onChange={handleChange}
                                                    min="1900" // Example minimum year
                                                    max={new Date().getFullYear() + 5} // Example maximum year
                                                />
                                                {formErrors.yearTaken && <p className="mt-2 text-sm text-red-600">{formErrors.yearTaken}</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                                                    Grade
                                                </label>
                                                <select
                                                    id="grade"
                                                    name="grade"
                                                    className={`mt-1 block w-full border ${formErrors.grade ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
                                                    Marks (0-100)
                                                </label>
                                                <input
                                                    type="number"
                                                    id="marks"
                                                    name="marks"
                                                    required
                                                    className={`mt-1 block w-full border ${formErrors.marks ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                    value={formData.marks}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="100"
                                                />
                                                {formErrors.marks && <p className="mt-2 text-sm text-red-600">{formErrors.marks}</p>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                            <button
                                                type="submit"
                                                className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                disabled={submitting || (editingCourseId === null && coursesForDropdown.length === 0)}
                                            >
                                                {submitting ? 'Saving...' : (editingCourseId ? 'Update Original' : (formData.isRetake ? 'Assign Retake' : 'Assign New Course'))}
                                            </button>
                                            {editingCourseId && (
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                    disabled={submitting}
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
