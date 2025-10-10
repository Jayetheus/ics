import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useFormValidation, commonRules } from '../utils/validation';
import { Eye, EyeOff, LogIn, User, Lock, Sparkles, GraduationCap } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid
  } = useFormValidation(
    { email: '', password: '' },
    { email: commonRules.email, password: commonRules.password }
  );

  useEffect(() => { 
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);

  const onSubmit = async (formData: any) => {
    try {
      setLoading(true);
      await login(formData.email, formData.password);
      
      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back! You have been logged in successfully.',
      });
      // Do not navigate immediately — wait for auth state change to update currentUser
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error.message || 'Failed to log in. Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for quick testing
  const demoAccounts = [
    { role: 'Student', email: 'student@edutech.edu.za', password: '123456', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
    { role: 'Lecturer', email: 'lecturer@edutech.edu.za', password: '123456', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
    { role: 'Admin', email: 'admin@edutech.co.za', password: '123456', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
    { role: 'Finance', email: 'finance@edutech.edu.za', password: 'password123', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  ];

  const fillDemo = (email: string, password: string) => {
    handleChange('email', email);
    handleChange('password', password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-lg opacity-75"></div>
            <div className="relative mx-auto h-20 w-20 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-2">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="mt-8 text-3xl font-bold text-gray-900">
            Welcome to EduTech
          </h2>
          <p className="mt-2 text-gray-600">
            Integrated College System
          </p>
          <p className="text-sm text-gray-500">
            South Africa
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <form 
            className="space-y-6" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit);
            }}
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={data.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    touched.email && errors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="student@EduTech.ac.za"
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" className="text-sm text-red-600 flex items-center mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700">
                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={data.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 pr-12 ${
                    touched.password && errors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" className="text-sm text-red-600 flex items-center mt-1" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid || !data.email || !data.password}
              className="group relative w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center">
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in to your account
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Links Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot password?
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors flex items-center"
            >
              Create new account
            </Link>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center flex items-center justify-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            Quick Demo Access
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                onClick={() => fillDemo(account.email, account.password)}
                className={`p-3 ${account.color} border rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-sm`}
              >
                {account.role}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            Click any role to auto-fill credentials
          </p>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center">
            <Lock className="h-3 w-3 mr-1" />
            Secure login powered by EduTech Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;