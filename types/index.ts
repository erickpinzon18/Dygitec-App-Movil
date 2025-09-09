// Type definitions for the Dygitec app

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: Date;
}

export interface Computer {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  year?: number;
  serialNumber?: string;
  description?: string;
  createdAt: Date;
}

export interface Repair {
  id: string;
  computerId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  compatibility: string[];
  quantity: number;
  cost: number;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  computer: Computer;
}
