// Navigation types for the Dygitec app

import { RepairWithDetails, Part, Equipment, Customer, EquipmentWithDetails, CustomerWithStats } from './index';

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Register: undefined;
  
  // Main App Navigation
  MainTabs: undefined;
  
  // Main App Tabs
  Repairs: undefined;
  Parts: undefined;
  Customers: undefined;
  Equipments: undefined;
  Settings: undefined;
  
  // QR Scanner
  QRScanner: undefined;
  
  // Barcode Display
  BarcodeDisplay: {
    id: string;
    type: 'repair' | 'part' | 'equipment';
    title: string;
    subtitle?: string;
  };
};

export type RepairsStackParamList = {
  RepairsList: undefined;
  NewRepair: { equipmentId?: string };
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

export type CustomersStackParamList = {
  CustomersList: undefined;
  NewCustomerForm: undefined;
  CustomerDetail: {
    customer: CustomerWithStats;
  };
  CustomerEquipments: {
    customerId: string;
    customerName: string;
  };
};

export type EquipmentsStackParamList = {
  EquipmentsList: undefined;
  NewEquipmentForm: {
    preselectedCustomer?: Customer;
  };
  EditEquipmentForm: {
    equipment: EquipmentWithDetails;
  };
  EquipmentDetail: {
    equipment: EquipmentWithDetails;
  };
  EquipmentRepairs: {
    equipmentId: string;
    equipmentInfo: string;
  };
};

export type SettingsStackParamList = {
  SettingsList: undefined;
  UserManagement: undefined;
  NewUser: undefined;
};

export type TabParamList = {
  Repairs: undefined;
  Parts: undefined;
  Customers: undefined;
  Equipments: undefined;
  QR: undefined;
  Settings: undefined;
};
