import { Link } from 'react-router-dom';
import backgroundImage from '../Assets/graduate.png'; 

const Home = () => {
  return (
    <div className="">
      {/* Changed max-w-9xl to max-w-7xl to match Navbar's max-width */}
      <div className=" px-4 sm:px-6 lg:px-8"> 
        <div className="relative max-w-7xl bg-gradient-to-br from-slate-500 via-blue-600 to-indigo-900">
          {/* Background Image with Enhanced Overlay */}
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt="Academic Excellence"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-indigo-900/80"></div>
            {/* Animated Geometric Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          </div>

          {/* This div already has max-w-7xl, so it's consistent */}
          <div className="relative max-w-7xl mx-auto py-32 px-4 sm:py-40 sm:px-6 lg:px-8 text-center">
            {/* Badge */}


            {/* Main Headline */}
            <h1 className="text-xl sm:text-xl md:text-xl lg:text-xl font-black tracking-tight text-white leading-none mb-8">
              Student Progress Tracker
            </h1>

            {/* Subtitle */}
            <p className="max-w-4xl mx-auto text-xl sm:text-2xl text-slate-200 leading-relaxed mb-12 font-light">
              A better way to track academic progress Secure, reliable, and easy-to-use platform for students and institutions to verify academic records.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
              <Link
                to="/register?role=student"
                className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="relative z-10">Start Your Journey</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                to="/register?role=institution"
                className="group px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                Institution Portal
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-s">Globally Trusted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm">Instantly Verifiable</span>
              </div>
            </div>
          </div>
        </div>

        {/* This div also needs adjustment if it's meant to follow the main content width */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">For Students</h3>
              <p className="mt-2 text-base text-gray-500">
                Track your academic progress, request transcripts, and share your records with institutions.
              </p>
              <div className="mt-6">
                <Link
                  to="/register?role=student"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register as Student
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">For Institutions</h3>
              <p className="mt-2 text-base text-gray-500">
                Verify student transcripts and track academic progress with our secure platform.
              </p>
              <div className="mt-6">
                <Link
                  to="/register?role=institution"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Register as Institution
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Secure & Reliable</h3>
              <p className="mt-2 text-base text-gray-500">
                Our platform uses advanced security measures to protect your data and ensure authenticity.
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                >
                  Login to Your Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;