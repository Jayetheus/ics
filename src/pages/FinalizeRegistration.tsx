import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, BookOpen, CreditCard, User, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getApplicationsByStudent, getSubjectsByCourse, enrollStudentSubjects, updateStudent } from '../services/database';
import { Subject, Application } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FinalizeRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [approvedApp, setApprovedApp] = useState<Application | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [year, setYear] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const apps = await getApplicationsByStudent(currentUser.uid);
        const app = apps.find(a => a.status === 'approved') || null;
        setApprovedApp(app);
        if (app) {
          const subs = await getSubjectsByCourse(app.courseCode);
          setSubjects(subs);
          // Pre-select required subjects
          const defaultSelected = Object.fromEntries(
            subs.map(s => [s.code, s.credits >= 6]) // Auto-select major subjects
          );
          setSelected(defaultSelected);
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load registration data.',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, addNotification]);

  const toggle = (code: string) => setSelected(prev => ({ ...prev, [code]: !prev[code] }));

  const finalize = async () => {
    if (!currentUser || !approvedApp) return;
    
    const chosen = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
    
    if (chosen.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Subjects Selected',
        message: 'Please select at least one subject to continue.',
      });
      return;
    }

    try {
      setFinalizing(true);
      await enrollStudentSubjects(currentUser.uid, chosen);
      await updateStudent(currentUser.uid, { 
        status: 'active' as any,
        year: year,
        course: approvedApp.courseCode
      });
      
      addNotification({
        type: 'success',
        title: 'Registration Complete!',
        message: 'Your registration has been finalized successfully.',
      });
      
      // Navigate to finance page for payment
      setTimeout(() => {
        navigate('/finance');
      }, 2000);
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: 'Failed to finalize registration. Please try again.',
      });
    } finally {
      setFinalizing(false);
    }
  };

  const selectedSubjects = Object.entries(selected).filter(([_, v]) => v);
  const totalCredits = selectedSubjects.reduce((sum, [code]) => {
    const subject = subjects.find(s => s.code === code);
    return sum + (subject?.credits || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!approvedApp) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Approved Application</h1>
          <p className="text-gray-600 mb-6">
            You need an approved course application before you can finalize your registration.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">Finalize Your Registration</h1>
            <p className="mt-1 opacity-90">Course: {approvedApp.courseCode}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Year Selection</span>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Subject Selection</span>
          </div>
          <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Step 1: Year Selection */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Select Your Year of Study</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(yearOption => (
              <button
                key={yearOption}
                onClick={() => setYear(yearOption)}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  year === yearOption 
                    ? 'border-blue-600 bg-blue-50 text-blue-900' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold">{yearOption}</div>
                <div className="text-sm">
                  {yearOption === 1 ? '1st' : yearOption === 2 ? '2nd' : yearOption === 3 ? '3rd' : '4th'} Year
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next: Select Subjects
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Subject Selection */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Select Your Subjects</h2>
            </div>
            <div className="text-sm text-gray-600">
              Total Credits: <span className="font-semibold">{totalCredits}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {subjects.map(s => (
              <label 
                key={s.id} 
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selected[s.code] 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={!!selected[s.code]} 
                  onChange={() => toggle(s.code)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{s.code} - {s.name}</div>
                  <div className="text-sm text-gray-600">{s.credits} credits • {s.semester}</div>
                </div>
              </label>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedSubjects.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Review Selection
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Review Your Registration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Course Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">Course:</span> {approvedApp.courseCode}</div>
                  <div><span className="text-gray-600">Year:</span> {year}</div>
                  <div><span className="text-gray-600">Total Credits:</span> {totalCredits}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Selected Subjects ({selectedSubjects.length})</h3>
                <div className="space-y-1 text-sm">
                  {selectedSubjects.map(([code]) => {
                    const subject = subjects.find(s => s.code === code);
                    return (
                      <div key={code} className="flex justify-between">
                        <span>{subject?.code}</span>
                        <span className="text-gray-600">{subject?.credits} credits</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-900">Next Steps</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  After finalizing your registration, you'll be redirected to the finance section to complete your payment and activate your student account.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Subjects
            </button>
            <button
              onClick={finalize}
              disabled={finalizing}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {finalizing ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Finalizing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finalize Registration
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalizeRegistration;



