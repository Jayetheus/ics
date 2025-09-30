import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { generateStudentNumber, getColleges } from '../services/database';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {

  const languageSubjects = [
    "English Home Language",
    "English First Additional Language",
    "Afrikaans Home Language",
    "Afrikaans First Additional Language",
    "isiZulu Home Language",
    "isiZulu First Additional Language",
    "isiXhosa Home Language",
    "isiXhosa First Additional Language",
    "Sesotho Home Language",
    "Sesotho First Additional Language",
    "Setswana Home Language",
    "Setswana First Additional Language",
    "Sepedi Home Language",
    "Sepedi First Additional Language",
    "Xitsonga Home Language",
    "Xitsonga First Additional Language",
    "Tshivenda Home Language",
    "Tshivenda First Additional Language",
    "Siswati Home Language",
    "Siswati First Additional Language",
  ];

  const mathsSubjects = [
    "Mathematics",
    "Mathematical Literacy",
  ];

  const otherMatricSubjects = [
    "Physical Sciences",
    "Life Sciences",
    "Accounting",
    "Business Studies",
    "Economics",
    "Geography",
    "History",
    "Information Technology",
    "Computer Applications Technology",
    "Consumer Studies",
    "Tourism",
    "Visual Arts",
    "Music",
    "Engineering Graphics and Design",
    "Dramatic Arts",
    "Agricultural Sciences",
    "Religion Studies",
    "Technical Mathematics",
    "Technical Sciences",
    "Civil Technology",
    "Electrical Technology",
    "Mechanical Technology",
    "Hospitality Studies",
    "Dance Studies",
    "Design",
    "Languages (Other Foreign Languages)",
  ];




  type Result = { subject: string; result: number };

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    college: string;
    phone: string;
    idNumber: string;
    examNumber: string;
    results: Result[];
  }>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
    firstName: '',
    lastName: '',
    college: '',
    phone: '',
    idNumber: '',
    examNumber: '',
    results: [],
  });


  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);

  const { register, currentUser } = useAuth();
  const navigate = useNavigate();




  useEffect(() => { if (currentUser) navigate("/", { replace: true }) }, [currentUser, navigate]);

  // Load colleges on component mount
  useEffect(() => {
    const loadColleges = async () => {
      try {
        const collegesData = await getColleges();
        setColleges(collegesData);
      } catch (error) {
        console.error('Error loading colleges:', error);
      }
    };
    loadColleges();
  }, []);

  // Helper to pick n random unique items from an array
    const pickRandom = <T,>(arr: T[], n: number): T[] => {
      const copy = [...arr];
      const result: T[] = [];
      while (result.length < n && copy.length) {
        const idx = Math.floor(Math.random() * copy.length);
        result.push(copy.splice(idx, 1)[0]);
      }
      return result;
    };

  function generateRandomResults() {
    

    // Pick 2 languages
    const languages = pickRandom(languageSubjects, 2);

    // Pick 1 maths subject
    const maths = pickRandom(mathsSubjects, 1);

    // Pick 4 other subjects
    const others = pickRandom(otherMatricSubjects, 4);

    // Helper to generate a random result (1-7)
    const randomResult = () => Math.floor(Math.random() * 7) + 1;

    // Build results array
    const results = [
      ...languages.map(subject => ({ subject, result: randomResult() })),
      ...maths.map(subject => ({ subject, result: randomResult() })),
      ...others.map(subject => ({ subject, result: randomResult() })),
    ];
    
    return results;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (formData.examNumber.length < 10) {
      return setError('Exam Number must be at least 10 numbers');
    }

    try {
      setError('');
      setLoading(true);

      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        college: formData.college,
        phone: formData.phone,
        idNumber: formData.idNumber,
        ...(formData.role === 'student' ? {
          studentNumber: await generateStudentNumber(),
        } : {}),
        examNumber: formData.examNumber,
        results: formData.results,
      };

      await register(formData.email, formData.password, formData.role, profileData);
      
      setSuccess('Registration successful! Please log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name==="examNumber" && e.target.value.length === 10) {
      const results = generateRandomResults()
      setFormData({ ...formData, [e.target.name]: e.target.value, results });
      return
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">EduTech</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Integrated College System
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@EduTech.ac.za"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 083 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Number
                </label>
                <input
                  type="text"
                  name="examNumber"
                  required
                  value={formData.examNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matric Results (auto-generated)
                </label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {formData.results.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-2 text-gray-400 text-center">Results will be generated on registration</td>
                        </tr>
                      ) : (
                        formData.results.map((res, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-gray-700">{res.subject}</td>
                            <td className="px-4 py-2 text-gray-700">{res.result}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 9901015800123"
                />
              </div>
            </div>

            {/* College Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College/Faculty
              </label>
              <select
                name="college"
                required
                value={formData.college}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a College/Faculty</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.name}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Student and staff numbers will be automatically generated upon registration.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              After registration, students can apply for courses in the Applications section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;