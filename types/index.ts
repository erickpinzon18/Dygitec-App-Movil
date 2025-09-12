// Type definitions for the Dygitec app

export interface Client {
  id: string;
  name: string;
  address: string;
}

export interface User {
  id: string;
  clientId: string;
  name: string;
  type: UserType;
  enabled: boolean;
}

export interface Customer {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  email?: string;
  registerBy: string;
  createdAt: Date;
}

export interface Computer {
  id: string;
  clientId: string;
  customerId: string;
  brand: string;
  model: string;
  year?: number;
  serialNumber?: string;
  description?: string;
  registerBy: string;
  createdAt: Date;
}

// Nuevo tipo para equipos independientes (Computer evolucionado)
export interface Equipment {
  id: string;
  clientId: string;
  customerId: string;
  brand: string;
  model: string;
  year?: number;
  serialNumber?: string;
  description?: string;
  registerBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repair {
  id: string;
  clientId: string;
  equipmentId: string; // Cambiado de computerId a equipmentId
  customerId: string;
  title: string;
  description: string;
  status: RepairStatus;
  priority: Priority;
  entryDate: Date;
  expectedCompletionDate?: Date;
  completionDate?: Date;
  cost?: number;
  notes?: string;
  registerBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  clientId: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  compatibility: string[];
  quantity: number;
  cost: number;
  location?: string;
  notes?: string;
  registerBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserType {
  ADMIN = 'admin',
  WORKER = 'worker',
  USER = 'user'
}

// Helper function to get user type display text
export const getUserTypeDisplayText = (type: UserType): string => {
  switch (type) {
    case UserType.ADMIN:
      return 'Administrador';
    case UserType.WORKER:
      return 'Trabajador';
    case UserType.USER:
      return 'Usuario Básico';
    default:
      return type;
  }
};

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface RepairWithDetails extends Repair {
  customer: Customer;
  equipment: Equipment; // Cambiado de computer a equipment
}

export interface EquipmentWithDetails extends Equipment {
  customer: Customer;
  repairs: Repair[];
  repairCount: number;
  activeRepairsCount: number;
  lastRepairDate?: Date;
}

export interface CustomerWithStats extends Customer {
  equipmentCount: number;
  repairCount: number;
  totalEquipments: number;
  totalRepairs: number;
  activeRepairs: number;
  lastRepairDate?: Date;
}

// Evidence photo types
export interface EvidencePhoto {
  id: string;
  repairId: string;
  url: string;
  filename: string;
  uploadedAt: Date;
  uploadedBy: string;
  size?: number;
  mimeType?: string;
}

export interface EvidenceUploadProgress {
  totalProgress: number;
  currentIndex: number;
  currentFile: string;
  isComplete: boolean;
}
