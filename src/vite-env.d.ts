/// <reference types="vite/client" />

declare module 'react-qr-scanner' {
  import { Component } from 'react';

  interface QrReaderProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (data: any) => void;
    style?: React.CSSProperties;
    facingMode?: 'user' | 'environment';
    legacyMode?: boolean;
    resolution?: number;
    showViewFinder?: boolean;
  }

  export default class QrReader extends Component<QrReaderProps> {}
}
