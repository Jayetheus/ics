import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { 
  getPaymentMethods, 
  createPaymentIntent, 
  confirmPayment, 
  addPaymentMethod,
  PaymentMethod,
  PaymentIntent 
} from '../../services/paymentService';
import { useNotification } from '../../context/NotificationContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  studentId: string;
  paymentType: 'registration' | 'tuition' | 'accommodation' | 'other';
  onSuccess: (amount: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  description,
  studentId,
  paymentType,
  onSuccess
}) => {
  const { addNotification } = useNotification();
  const [step, setStep] = useState<'methods' | 'payment' | 'processing' | 'success' | 'error'>('methods');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen, studentId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await getPaymentMethods(studentId);
      setPaymentMethods(methods);
      if (methods.length > 0) {
        const defaultMethod = methods.find(m => m.isDefault) || methods[0];
        setSelectedMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load payment methods'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create payment intent
      const intent = await createPaymentIntent(
        amount,
        'ZAR',
        description,
        studentId,
        { paymentType }
      );
      
      setPaymentIntent(intent);
      setStep('payment');
      
      // Confirm payment
      const result = await confirmPayment(intent.id, selectedMethod);
      
      if (result.success) {
        setStep('success');
        onSuccess(amount);
        addNotification({
          type: 'success',
          title: 'Payment Successful',
          message: `Payment of R${amount.toLocaleString()} has been processed successfully`
        });
      } else {
        setError(result.error || 'Payment failed');
        setStep('error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.number || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvc || !newCard.name) {
      setError('Please fill in all card details');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await addPaymentMethod(studentId, 'card', {
        number: newCard.number,
        expiryMonth: parseInt(newCard.expiryMonth),
        expiryYear: parseInt(newCard.expiryYear),
        cvc: newCard.cvc,
        name: newCard.name
      });

      if (result.success && result.paymentMethod) {
        setPaymentMethods([...paymentMethods, result.paymentMethod]);
        setSelectedMethod(result.paymentMethod.id);
        setShowAddCard(false);
        setNewCard({ number: '', expiryMonth: '', expiryYear: '', cvc: '', name: '' });
        addNotification({
          type: 'success',
          title: 'Card Added',
          message: 'Payment method added successfully'
        });
      } else {
        setError(result.error || 'Failed to add card');
      }
    } catch (error) {
      console.error('Add card error:', error);
      setError('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('methods');
    setError('');
    setShowAddCard(false);
    setNewCard({ number: '', expiryMonth: '', expiryYear: '', cvc: '', name: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{description}</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount</span>
              <span className="text-2xl font-bold text-gray-900">R{amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Step 1: Payment Methods */}
          {step === 'methods' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="mr-3"
                      />
                      <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {method.type === 'card' 
                            ? `${method.brand?.toUpperCase()} ending in ${method.last4}`
                            : method.type === 'bank_transfer'
                            ? 'Bank Transfer'
                            : 'EFT'
                          }
                        </div>
                        {method.type === 'card' && (
                          <div className="text-sm text-gray-500">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={() => setShowAddCard(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  >
                    + Add New Payment Method
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!selectedMethod || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Pay R{amount.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* Add Card Form */}
          {showAddCard && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Add New Card</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={newCard.number}
                    onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Month
                    </label>
                    <input
                      type="text"
                      value={newCard.expiryMonth}
                      onChange={(e) => setNewCard({...newCard, expiryMonth: e.target.value})}
                      placeholder="MM"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Year
                    </label>
                    <input
                      type="text"
                      value={newCard.expiryYear}
                      onChange={(e) => setNewCard({...newCard, expiryYear: e.target.value})}
                      placeholder="YYYY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={newCard.cvc}
                      onChange={(e) => setNewCard({...newCard, cvc: e.target.value})}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={newCard.name}
                      onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCard}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Add Card'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your payment...</p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}

          {/* Step 4: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('methods')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="h-4 w-4 mr-2" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
