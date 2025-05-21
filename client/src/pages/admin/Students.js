import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    department: '',
    program: '',
    gpa: ''
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/students');
        setStudents(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleEditClick = (student) => {
    setEditingStudent(student._id);
    setEditFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      studentId: student.studentId,
      department: student.department,
      program: student.program,
      gpa: student.gpa.toString()
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleCancelClick = () => {
    setEditingStudent(null);
  };

  const handleUpdateStudent = async (studentId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/students/${studentId}`,
        editFormData
      );
      
      setStudents(students.map(student => 
        student._id === studentId ? res.data.data : student
      ));
      setEditingStudent(null);
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  };

  const handleDownloadTranscript = async (studentId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/students/${studentId}/transcript`,
        { responseType: 'blob' }
      );
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download transcript:', err);
      alert('Failed to download transcript');
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower) ||
      student.department.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search students..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingStudent === student._id ? (
                      <input
                        type="text"
                        name="studentId"
                        value={editFormData.studentId}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      student.studentId
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingStudent === student._id ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="firstName"
                          value={editFormData.firstName}
                          onChange={handleEditFormChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          name="lastName"
                          value={editFormData.lastName}
                          onChange={handleEditFormChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    ) : (
                      `${student.firstName} ${student.lastName}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingStudent === student._id ? (
                      <input
                        type="text"
                        name="department"
                        value={editFormData.department}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      student.department
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingStudent === student._id ? (
                      <input
                        type="text"
                        name="program"
                        value={editFormData.program}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      student.program
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingStudent === student._id ? (
                      <input
                        type="number"
                        name="gpa"
                        step="0.01"
                        min="0"
                        max="4"
                        value={editFormData.gpa}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      student.gpa.toFixed(2)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {editingStudent === student._id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateStudent(student._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>

                        <Link
                          to={`/admin/students/${student._id}/progress`}
                          className="text-green-600 hover:text-green-900"
                        >
                          View Progress
                        </Link>
                        <button
                          onClick={() => handleDownloadTranscript(student._id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Transcript
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;