import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import { emailService } from '../../services/emailService';
import { useNotification } from '../../context/NotificationContext';

const EmailTestPanel: React.FC = () => {
  const { addNotification } = useNotification();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const success = await emailService.testEmailService();
      
      if (success) {
        setTestResult('success');
        addNotification({
          type: 'success',
          title: 'Email Test Successful',
          message: 'Email service is working correctly. Check console for details.'
        });
      } else {
        setTestResult('error');
        addNotification({
          type: 'error',
          title: 'Email Test Failed',
          message: 'Email service test failed. Check console for details.'
        });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      setTestResult('error');
      addNotification({
        type: 'error',
        title: 'Email Test Error',
        message: 'An error occurred while testing email service.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <Mail className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Email Service Test</h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        Test the email notification system to ensure it's working correctly.
      </p>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={handleTestEmail}
          disabled={isTesting}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            isTesting
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Email Service
            </>
          )}
        </button>
        
        {testResult && (
          <div className="flex items-center">
            {testResult === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">Test Passed</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">Test Failed</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> This is a mock email service that logs to the console. 
          In production, replace the email service implementation with a real email provider 
          like SendGrid, AWS SES, or similar.
        </p>
      </div>
    </div>
  );
};

export default EmailTestPanel;
