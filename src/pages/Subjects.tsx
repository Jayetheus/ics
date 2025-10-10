import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getResultsByStudent, getStudentSubjects } from '../services/database';
import { Subject, Result } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Subjects: React.FC = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const courseCodes = currentUser?.enrolledSubjects;
        if (courseCodes) {
          const [subs, studentResults] = await Promise.all([
            getStudentSubjects(currentUser.uid),
            getResultsByStudent(currentUser.uid)
          ]);
          setSubjects(subs);
          setResults(studentResults);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, subjects]);

  const getSubjectResult = (subjectCode: string) => {
    return results.find(result => result.subjectCode === subjectCode || result.courseCode === subjectCode);
  };

  const semesters = [...new Set(subjects.map(s => s.semester))];
  const filteredSubjects = selectedSemester === 'all' 
    ? subjects 
    : subjects.filter(s => s.semester === selectedSemester);

  const totalCredits = filteredSubjects.reduce((sum, s) => sum + s.credits, 0);
  const completedSubjects = filteredSubjects.filter(s => getSubjectResult(s.code)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
            <p className="text-gray-600 mt-1">View your enrolled subjects and academic progress</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
              <div className="text-gray-600">Total Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedSubjects}</div>
              <div className="text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Semesters</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredSubjects.length} subjects • {totalCredits} total credits
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map(subject => {
            const result = getSubjectResult(subject.code);
            return (
              <div key={subject.code} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{subject.code}</h3>
                        <p className="text-sm text-gray-600">{subject.credits} Credits</p>
                      </div>
                    </div>
                    {result && (
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          result.mark >= 80 ? 'text-green-600' :
                          result.mark >= 70 ? 'text-blue-600' :
                          result.mark >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {result.mark}%
                        </div>
                        <div className="text-sm text-gray-600">{result.grade}</div>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">{subject.name}</h4>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {subject.semester}
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {subject.credits} Credits
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result ? 'Completed' : 'In Progress'}
                      </span>
                      {result && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                          View Details
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Found</h3>
          <p className="text-gray-600">
            {selectedSemester === 'all' 
              ? 'No subjects found for your course. Please contact administration.'
              : `No subjects found for ${selectedSemester}. Try selecting a different semester.`}
          </p>
        </div>
      )}

      {/* Academic Progress Summary */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
              <div className="text-sm text-gray-600">Total Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.length}</div>
              <div className="text-sm text-gray-600">Results Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.mark, 0) / results.length) : 0}%
              </div>
              <div className="text-sm text-gray-600">Average Grade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {subjects.reduce((sum, s) => sum + s.credits, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;



