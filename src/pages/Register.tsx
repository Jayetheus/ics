import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { generateStudentNumber } from '../services/database';
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock, Phone, IdCard, BookOpen, GraduationCap } from 'lucide-react';

const Register: React.FC = () => {
  const languageSubjects = [
    "English Home Language", "English First Additional Language",
    "Afrikaans Home Language", "Afrikaans First Additional Language",
    "isiZulu Home Language", "isiZulu First Additional Language",
    "isiXhosa Home Language", "isiXhosa First Additional Language",
    "Sesotho Home Language", "Sesotho First Additional Language",
    "Setswana Home Language", "Setswana First Additional Language",
    "Sepedi Home Language", "Sepedi First Additional Language",
    "Xitsonga Home Language", "Xitsonga First Additional Language",
    "Tshivenda Home Language", "Tshivenda First Additional Language",
    "Siswati Home Language", "Siswati First Additional Language",
  ];

  const mathsSubjects = [
    "Mathematics", "Mathematical Literacy",
  ];

  const otherMatricSubjects = [
    "Physical Sciences", "Life Sciences", "Accounting", "Business Studies",
    "Economics", "Geography", "History", "Information Technology",
    "Computer Applications Technology", "Consumer Studies", "Tourism",
    "Visual Arts", "Music", "Engineering Graphics and Design", "Dramatic Arts",
    "Agricultural Sciences", "Religion Studies", "Technical Mathematics",
    "Technical Sciences", "Civil Technology", "Electrical Technology",
    "Mechanical Technology", "Hospitality Studies", "Dance Studies", "Design",
    "Languages (Other Foreign Languages)",
  ];

  type Result = { subject: string; result: number };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
    firstName: '',
    lastName: '',
    college: '',
    course: '',
    year: 1,
    phone: '',
    idNumber: '',
    examNumber: '',
    results: [] as Result[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { register, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { 
    if (currentUser) navigate("/", { replace: true }); 
  }, [currentUser, navigate]);

  // Helper to pick n random unique items from an array
  const pickRandom = <T,>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  const generateRandomResults = (): Result[] => {
    // Pick 2 languages, 1 maths, and 4 other subjects
    const languages = pickRandom(languageSubjects, 2);
    const maths = pickRandom(mathsSubjects, 1);
    const others = pickRandom(otherMatricSubjects, 4);

    const allSubjects = [...languages, ...maths, ...others];
    
    // Generate results (1-7 scale, with higher probability for 3-6 range)
    return allSubjects.map(subject => ({
      subject,
      result: Math.min(7, Math.max(1, Math.floor(Math.random() * 6) + 2)) // Mostly 2-7 range
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.examNumber.length !== 10) {
      setError('Exam Number must be exactly 10 characters');
      return false;
    }

    if (formData.idNumber && !/^\d{13}$/.test(formData.idNumber)) {
      setError('ID Number must be 13 digits');
      return false;
    }

    if (formData.phone && !/^[\d\s+\-()]{10,}$/.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        college: formData.college,
        phone: formData.phone,
        idNumber: formData.idNumber,
        ...(formData.role === 'student' ? {
          course: formData.course,
          year: formData.year,
          studentNumber: await generateStudentNumber(),
        } : {}),
        examNumber: formData.examNumber,
        results: formData.results,
      };

      await register(formData.email, formData.password, formData.role, profileData);
      setSuccess('Registration successful! Redirecting to login...');
      alert(
        "Go to Profile and Upload All Required Documents!"
      )
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Generate results when exam number reaches 10 characters
      if (name === "examNumber" && value.length === 10 && prev.results.length === 0) {
        return { ...newFormData, results: generateRandomResults() };
      }
      
      return newFormData;
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const hasError = (field: string) => touched[field] && !formData[field as keyof typeof formData];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-lg opacity-75"></div>
            <div className="relative mx-auto h-20 w-20 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-2">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="mt-8 text-3xl font-bold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-gray-600">
            Join the Integrated College System
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('firstName')}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    hasError('firstName') 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('lastName')}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    hasError('lastName') 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  hasError('email') 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="your.email@EduTech.ac.za"
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      hasError('password') 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      hasError('confirmPassword') 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="083 123 4567"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <IdCard className="h-4 w-4 mr-2 text-gray-400" />
                  ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('idNumber')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="9901015800123"
                />
              </div>
            </div>

            {/* Exam Number and Results */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  Exam Number
                </label>
                <input
                  type="text"
                  name="examNumber"
                  required
                  value={formData.examNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('examNumber')}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    hasError('examNumber') 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter 10-digit exam number"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.examNumber.length}/10 characters - Results will auto-generate when complete
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  Matric Results {formData.results.length > 0 && `(${formData.results.length} subjects)`}
                </label>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.results.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-4 text-gray-400 text-center">
                            Enter your 10-digit exam number to generate results
                          </td>
                        </tr>
                      ) : (
                        formData.results.map((res, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{res.subject}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{res.result}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in here
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Student numbers are automatically generated upon registration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;