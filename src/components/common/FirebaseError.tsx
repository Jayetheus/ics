import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const FirebaseError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Configuration Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Firebase configuration is missing or invalid. Please set up your environment variables.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Setup Instructions</h3>
              <ol className="mt-2 text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the root directory</li>
                <li>Add your Firebase configuration variables</li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExternalLink className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Need Help?
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Check the <code className="bg-blue-100 px-1 rounded">ENVIRONMENT_SETUP.md</code> file for detailed instructions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseError;
