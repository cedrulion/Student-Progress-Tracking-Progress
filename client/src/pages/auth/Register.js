import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentId: '',
    department: '',
    program: '',
    enrollmentYear: new Date().getFullYear(),
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const roleParam = query.get('role');
    if (roleParam && ['student', 'institution'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [location]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const data = { 
        email: formData.email, 
        password: formData.password, 
        role 
      };

      if (role === 'student') {
        Object.assign(data, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          studentId: formData.studentId,
          department: formData.department,
          program: formData.program,
          enrollmentYear: parseInt(formData.enrollmentYear)
        });
      } else {
        Object.assign(data, {
          name: formData.name,
          address: formData.address,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone
        });
      }

      await register(data);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentFields = [
    { name: 'firstName', type: 'text', placeholder: 'First Name', required: true },
    { name: 'lastName', type: 'text', placeholder: 'Last Name', required: true },
    { name: 'studentId', type: 'text', placeholder: 'Student ID', required: true },
    { name: 'department', type: 'text', placeholder: 'Department (e.g., Information Systems)', required: true },
    { name: 'program', type: 'text', placeholder: "Program (e.g., Bachelor's Degree)", required: true },
  ];

  const institutionFields = [
    { name: 'name', type: 'text', placeholder: 'Institution Name', required: true },
    { name: 'address', type: 'text', placeholder: 'Institution Address', required: true },
    { name: 'contactEmail', type: 'email', placeholder: 'Contact Email', required: true },
    { name: 'contactPhone', type: 'tel', placeholder: 'Contact Phone', required: true },
  ];

  const renderInputField = (field) => (
    <div key={field.name} className="mb-4">
      <input
        id={field.name}
        name={field.name}
        type={field.type}
        required={field.required}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
        placeholder={field.placeholder}
        value={formData[field.name]}
        onChange={onChange}
        disabled={isSubmitting}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-100 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Account</h1>
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`px-6 py-3 text-sm font-medium ${role === 'student' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('institution')}
                className={`px-6 py-3 text-sm font-medium ${role === 'institution' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Institution
              </button>
            </div>
          </div>

          {error && <Alert type="error" message={error} className="mb-6" />}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Email address"
                value={formData.email}
                onChange={onChange}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={onChange}
                minLength="6"
                disabled={isSubmitting}
              />
            </div>

            {role === 'student' ? (
              <>
                {studentFields.map(renderInputField)}
                <div className="mb-4">
                  <select
                    name="enrollmentYear"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                    value={formData.enrollmentYear}
                    onChange={onChange}
                    disabled={isSubmitting}
                  >
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              institutionFields.map(renderInputField)
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;