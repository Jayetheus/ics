// Stripe-like payment simulation service
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'eft';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  payment_method?: string;
  description: string;
  metadata: Record<string, string>;
}

export interface OutstandingBalance {
  studentId: string;
  totalOutstanding: number;
  breakdown: {
    tuition: number;
    registration: number;
    accommodation: number;
    other: number;
  };
  lastUpdated: string;
}

// Simulate Stripe payment methods
export const getPaymentMethods = async (studentId: string): Promise<PaymentMethod[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'pm_card_visa',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: 'pm_card_mastercard',
      type: 'card',
      last4: '5555',
      brand: 'mastercard',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    },
    {
      id: 'pm_bank_absa',
      type: 'bank_transfer',
      isDefault: false
    }
  ];
};

// Simulate creating payment intent
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'ZAR',
  description: string,
  studentId: string,
  metadata: Record<string, string> = {}
): Promise<PaymentIntent> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: paymentIntentId,
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    status: 'requires_payment_method',
    client_secret: `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 24)}`,
    description,
    metadata: {
      studentId,
      ...metadata
    }
  };
};

// Simulate confirming payment
export const confirmPayment = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return { success: true };
  } else {
    return { 
      success: false, 
      error: 'Your card was declined. Please try a different payment method.' 
    };
  }
};

// Simulate getting outstanding balance
export const getOutstandingBalance = async (studentId: string): Promise<OutstandingBalance> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data - in real app, this would come from your database
  return {
    studentId,
    totalOutstanding: 15000,
    breakdown: {
      tuition: 12000,
      registration: 2000,
      accommodation: 1000,
      other: 0
    },
    lastUpdated: new Date().toISOString()
  };
};

// Simulate processing successful payment and updating balance
export const processSuccessfulPayment = async (
  studentId: string,
  amount: number,
  paymentType: 'registration' | 'tuition' | 'accommodation' | 'other'
): Promise<{ success: boolean; newBalance: number }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would update the database
  // For now, we'll simulate the calculation
  const currentBalance = await getOutstandingBalance(studentId);
  const newBalance = Math.max(0, currentBalance.totalOutstanding - amount);
  
  return {
    success: true,
    newBalance
  };
};

// Simulate adding new payment method
export const addPaymentMethod = async (
  studentId: string,
  type: 'card' | 'bank_transfer' | 'eft',
  cardDetails?: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    name: string;
  }
): Promise<{ success: boolean; paymentMethod?: PaymentMethod; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate validation
  if (type === 'card' && cardDetails) {
    // Basic validation
    if (cardDetails.number.length < 13) {
      return { success: false, error: 'Invalid card number' };
    }
    if (cardDetails.expiryYear < new Date().getFullYear()) {
      return { success: false, error: 'Card has expired' };
    }
    if (cardDetails.cvc.length < 3) {
      return { success: false, error: 'Invalid CVC' };
    }
  }
  
  const newPaymentMethod: PaymentMethod = {
    id: `pm_${type}_${Date.now()}`,
    type,
    last4: type === 'card' ? cardDetails?.number.slice(-4) : undefined,
    brand: type === 'card' ? 'visa' : undefined,
    expiryMonth: type === 'card' ? cardDetails?.expiryMonth : undefined,
    expiryYear: type === 'card' ? cardDetails?.expiryYear : undefined,
    isDefault: false
  };
  
  return { success: true, paymentMethod: newPaymentMethod };
};

// Simulate payment history
export const getPaymentHistory = async (studentId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'pi_1',
      amount: 5000,
      currency: 'ZAR',
      status: 'succeeded',
      description: 'Tuition Payment - Semester 1',
      date: '2024-01-15T10:30:00Z',
      paymentMethod: 'Visa ending in 4242'
    },
    {
      id: 'pi_2',
      amount: 2000,
      currency: 'ZAR',
      status: 'succeeded',
      description: 'Registration Fee',
      date: '2024-01-10T14:20:00Z',
      paymentMethod: 'Visa ending in 4242'
    },
    {
      id: 'pi_3',
      amount: 1000,
      currency: 'ZAR',
      status: 'succeeded',
      description: 'Accommodation Deposit',
      date: '2024-01-05T09:15:00Z',
      paymentMethod: 'Mastercard ending in 5555'
    }
  ];
};
