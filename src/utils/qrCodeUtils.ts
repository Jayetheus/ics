import QRCode from 'qrcode';

export interface QRCodeData {
  sessionId: string;
  lecturerId: string;
  subjectCode: string;
  courseCode: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  timestamp: number;
}


export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  try {
    const qrData = JSON.stringify(data);
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRCode = (qrData: string): any | null => {
  try {
    const parsed = JSON.parse(qrData);
    
    // For attendance QR codes, we expect a simpler format
    if (parsed.sessionId && parsed.timestamp && parsed.type) {
      return parsed;
    }
    
    // For full QR code data, validate required fields
    if (parsed.sessionId && parsed.lecturerId && parsed.subjectCode) {
      return parsed as QRCodeData;
    }
    
    throw new Error('Invalid QR code data');
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

export const isQRCodeExpired = (timestamp: number, durationMinutes: number = 15): boolean => {
  const now = Date.now();
  const expirationTime = timestamp + (durationMinutes * 60 * 1000);
  return now > expirationTime;
};

export const generateQRCodeData = (
  sessionId: string,
  lecturerId: string,
  subjectCode: string,
  courseCode: string,
  venue: string,
  date: string,
  startTime: string,
  endTime: string
): QRCodeData => {
  return {
    sessionId,
    lecturerId,
    subjectCode,
    courseCode,
    venue,
    date,
    startTime,
    endTime,
    timestamp: Date.now()
  };
};
