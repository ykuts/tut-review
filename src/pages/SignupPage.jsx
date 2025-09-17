import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiSparkles } from 'react-icons/hi2';

const SignupPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <Link 
                    to="/" 
                    className="inline-flex items-center text-gray-600 hover:text-[#FF5F90] mb-8 transition-colors duration-200"
                >
                    <HiArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                </Link>

                {/* Signup Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF5F90] to-red-500 rounded-2xl mb-6">
                        <HiSparkles className="w-8 h-8 text-white" />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Account</h1>
                    
                    <p className="text-gray-600 mb-8">
                        Account creation is coming soon! For now, you can sign in with your existing Microsoft or Google accounts.
                    </p>
                    
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full px-6 py-3 bg-[#FF5F90] text-white font-semibold rounded-lg hover:bg-[#FF5F90]/90 transition-all duration-200 transform hover:scale-105"
                        >
                            Go to Sign In
                        </button>
                        
                        <button
                            onClick={() => navigate('/')}
                            className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-[#FF5F90] hover:text-[#FF5F90] transition-all duration-200"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;