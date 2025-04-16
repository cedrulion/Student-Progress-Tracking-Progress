import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';

const VerifyEmail = () => {
  const { token } = useParams();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { verifyEmail } = useContext(AuthContext);

  useEffect(() => {
    const verify = async () => {
      try {
        const verified = await verifyEmail(token);
        if (verified) {
          setSuccess(true);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    verify();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && (
          <>
            <Alert 
              type="success" 
              message="Email verified successfully! You can now log in to your account." 
            />
            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;