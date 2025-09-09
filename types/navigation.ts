// Navigation types for the Dygitec app

import { RepairWithDetails, Part } from './index';

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Register: undefined;
  
  // Main App Navigation
  MainTabs: undefined;
  
  // Main App Tabs
  Repairs: undefined;
  Parts: undefined;
  Settings: undefined;
  
  // QR Scanner
  QRScanner: undefined;
  
  // Barcode Display
  BarcodeDisplay: {
    id: string;
    type: 'repair' | 'part';
    title: string;
    subtitle?: string;
  };
};

export type RepairsStackParamList = {
  RepairsList: undefined;
  NewRepair: undefined;
  RepairDetail: {
    repair: RepairWithDetails;
  };
};

export type PartsStackParamList = {
  PartsList: undefined;
  NewPart: undefined;
  PartDetail: {
    part: Part;
  };
};

export type SettingsStackParamList = {
  SettingsList: undefined;
};

export type TabParamList = {
  Repairs: undefined;
  Parts: undefined;
  QR: undefined;
  Settings: undefined;
};
