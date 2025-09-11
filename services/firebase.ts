// Firebase service functions for authentication and data management

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Client, User, Customer, Computer, Equipment, Repair, Part, RepairWithDetails, EquipmentWithDetails, CustomerWithStats, RepairStatus } from '../types';

// Authentication services
export const authService = {
  signUp: async (email: string, password: string, name: string, clientId: string, userType: string = 'user') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document using the Auth UID as document ID
    await setDoc(doc(db, 'users', user.uid), {
      clientId,
      name,
      type: userType,
      enabled: true
    });
    
    return user;
  },

  // Método para que admins creen usuarios sin afectar su sesión
  createUserAsAdmin: async (email: string, password: string, name: string, clientId: string, userType: string = 'worker') => {
    // Crear usuario usando Firebase Admin (esto requeriría configuración del lado del servidor)
    // Por ahora usaremos el método normal y manejaremos la re-autenticación
    const currentUser = auth.currentUser;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Create user document using the Auth UID as document ID
      await setDoc(doc(db, 'users', newUser.uid), {
        clientId,
        name,
        type: userType,
        enabled: true
      });
      
      // Re-autenticar al usuario actual
      if (currentUser) {
        // Forzar recarga del usuario actual
        await currentUser.reload();
      }
      
      return newUser.uid;
    } catch (error) {
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  signOut: async () => {
    return await signOut(auth);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};

// Client services
export const clientService = {
  create: async (clientData: Omit<Client, 'id'>) => {
    const docRef = await addDoc(collection(db, 'clients'), clientData);
    return docRef.id;
  },

  getById: async (id: string): Promise<Client | null> => {
    const docSnap = await getDoc(doc(db, 'clients', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Client;
    }
    return null;
  },

  update: async (id: string, data: Partial<Client>) => {
    await updateDoc(doc(db, 'clients', id), data);
  }
};

// User services
export const userService = {
  getById: async (id: string): Promise<User | null> => {
    const docSnap = await getDoc(doc(db, 'users', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    }
    return null;
  },

  getByClientId: async (clientId: string): Promise<User[]> => {
    const q = query(collection(db, 'users'), where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  },

  create: async (userData: Omit<User, 'id'>) => {
    const docRef = await addDoc(collection(db, 'users'), userData);
    return docRef.id;
  },

  update: async (id: string, data: Partial<User>) => {
    const userDocRef = doc(db, 'users', id);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error(`Usuario no encontrado en la base de datos. ID: ${id}`);
    }
    
    await updateDoc(userDocRef, data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
  }
};

// Customer services
export const customerService = {
  create: async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  getByClientId: async (clientId: string): Promise<Customer[]> => {
    const q = query(
      collection(db, 'customers'), 
      where('clientId', '==', clientId),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Customer[];
  },

  getWithStats: async (clientId: string): Promise<CustomerWithStats[]> => {
    const customers = await customerService.getByClientId(clientId);
    const customersWithStats = await Promise.all(customers.map(async (customer) => {
      const equipments = await equipmentService.getByCustomerId(customer.id, clientId);
      const totalEquipments = equipments.length;
      
      // Count repairs for all customer's equipments
      let totalRepairs = 0;
      let activeRepairs = 0;
      
      for (const equipment of equipments) {
        const equipmentRepairs = await repairService.getByEquipmentId(equipment.id, clientId);
        totalRepairs += equipmentRepairs.length;
        activeRepairs += equipmentRepairs.filter(repair => 
          repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
        ).length;
      }

      return {
        ...customer,
        equipmentCount: totalEquipments,
        repairCount: totalRepairs,
        totalEquipments: totalEquipments,
        totalRepairs: totalRepairs,
        activeRepairs: activeRepairs,
        lastRepairDate: totalRepairs > 0 ? equipments[0].updatedAt : undefined
      };
    }));
    
    return customersWithStats;
  },

  getById: async (id: string): Promise<Customer | null> => {
    const docSnap = await getDoc(doc(db, 'customers', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate()
      } as Customer;
    }
    return null;
  },

  update: async (id: string, data: Partial<Customer>) => {
    await updateDoc(doc(db, 'customers', id), data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'customers', id));
  }
};

// Computer services (maintained for compatibility)
export const computerService = {
  create: async (computerData: Omit<Computer, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'computers'), {
      ...computerData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  getByClientId: async (clientId: string): Promise<Computer[]> => {
    const q = query(
      collection(db, 'computers'), 
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Computer[];
  },

  getByCustomerId: async (customerId: string, clientId: string): Promise<Computer[]> => {
    const q = query(
      collection(db, 'computers'), 
      where('customerId', '==', customerId),
      where('clientId', '==', clientId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Computer[];
  },

  getById: async (id: string): Promise<Computer | null> => {
    const docSnap = await getDoc(doc(db, 'computers', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate()
      } as Computer;
    }
    return null;
  },

  update: async (id: string, data: Partial<Computer>) => {
    await updateDoc(doc(db, 'computers', id), data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'computers', id));
  }
};

// Equipment services (new primary entity)
export const equipmentService = {
  create: async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(collection(db, 'equipments'), {
      ...equipmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  getByClientId: async (clientId: string): Promise<Equipment[]> => {
    const q = query(
      collection(db, 'equipments'), 
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Equipment[];
  },

  getWithDetails: async (clientId: string): Promise<EquipmentWithDetails[]> => {
    const equipments = await equipmentService.getByClientId(clientId);
    const equipmentsWithDetails = await Promise.all(equipments.map(async (equipment) => {
      const customer = await customerService.getById(equipment.customerId);
      const repairs = await repairService.getByEquipmentId(equipment.id, clientId);
      const activeRepairs = repairs.filter(repair => 
        repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
      );
      
      return {
        ...equipment,
        customer: customer!,
        repairs,
        repairCount: repairs.length,
        activeRepairsCount: activeRepairs.length,
        lastRepairDate: repairs.length > 0 ? repairs[0].createdAt : undefined
      };
    }));
    
    return equipmentsWithDetails;
  },

  getByCustomerId: async (customerId: string, clientId: string): Promise<Equipment[]> => {
    const q = query(
      collection(db, 'equipments'), 
      where('customerId', '==', customerId),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Equipment[];
  },

  getByCustomerIdWithDetails: async (customerId: string, clientId: string): Promise<EquipmentWithDetails[]> => {
    const equipments = await equipmentService.getByCustomerId(customerId, clientId);
    const customer = await customerService.getById(customerId);
    
    const equipmentsWithDetails = await Promise.all(equipments.map(async (equipment) => {
      const repairs = await repairService.getByEquipmentId(equipment.id, clientId);
      const activeRepairs = repairs.filter(repair => 
        repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
      );
      
      return {
        ...equipment,
        customer: customer!,
        repairs,
        repairCount: repairs.length,
        activeRepairsCount: activeRepairs.length,
        lastRepairDate: repairs.length > 0 ? repairs[0].createdAt : undefined
      };
    }));
    
    return equipmentsWithDetails;
  },

  getById: async (id: string): Promise<Equipment | null> => {
    const docSnap = await getDoc(doc(db, 'equipments', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Equipment;
    }
    return null;
  },

  getByCode: async (code: string, clientId: string): Promise<Equipment | null> => {
    const q = query(
      collection(db, 'equipments'),
      where('code', '==', code),
      where('clientId', '==', clientId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Equipment;
    }
    return null;
  },

  update: async (id: string, data: Partial<Equipment>) => {
    await updateDoc(doc(db, 'equipments', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'equipments', id));
  }
};

// Repair services
export const repairService = {
  create: async (repairData: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(collection(db, 'repairs'), {
      ...repairData,
      entryDate: Timestamp.fromDate(repairData.entryDate),
      expectedCompletionDate: repairData.expectedCompletionDate ? Timestamp.fromDate(repairData.expectedCompletionDate) : null,
      completionDate: repairData.completionDate ? Timestamp.fromDate(repairData.completionDate) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  getByClientId: async (clientId: string): Promise<Repair[]> => {
    const q = query(
      collection(db, 'repairs'), 
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      entryDate: doc.data().entryDate.toDate(),
      expectedCompletionDate: doc.data().expectedCompletionDate?.toDate(),
      completionDate: doc.data().completionDate?.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Repair[];
  },

  getWithDetails: async (clientId: string): Promise<RepairWithDetails[]> => {
    const repairs = await repairService.getByClientId(clientId);
    const repairsWithDetails = await Promise.all(repairs.map(async (repair) => {
      const equipment = await equipmentService.getById(repair.equipmentId || '');
      const customer = equipment ? await customerService.getById(equipment.customerId) : null;
      
      // Solo incluir reparaciones que tengan equipment y customer válidos
      if (equipment && customer) {
        return {
          ...repair,
          equipment,
          customer
        };
      }
      return null;
    }));
    
    // Filtrar null values
    return repairsWithDetails.filter(repair => repair !== null) as RepairWithDetails[];
  },

  getByStatus: async (status: string, clientId: string): Promise<Repair[]> => {
    const q = query(
      collection(db, 'repairs'), 
      where('status', '==', status),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      entryDate: doc.data().entryDate.toDate(),
      expectedCompletionDate: doc.data().expectedCompletionDate?.toDate(),
      completionDate: doc.data().completionDate?.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Repair[];
  },

  getByEquipmentId: async (equipmentId: string, clientId: string): Promise<Repair[]> => {
    const q = query(
      collection(db, 'repairs'),
      where('equipmentId', '==', equipmentId),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      entryDate: doc.data().entryDate.toDate(),
      expectedCompletionDate: doc.data().expectedCompletionDate?.toDate(),
      completionDate: doc.data().completionDate?.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Repair[];
  },

  getById: async (id: string): Promise<Repair | null> => {
    const docSnap = await getDoc(doc(db, 'repairs', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        entryDate: docSnap.data().entryDate.toDate(),
        expectedCompletionDate: docSnap.data().expectedCompletionDate?.toDate(),
        completionDate: docSnap.data().completionDate?.toDate(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate()
      } as Repair;
    }
    return null;
  },

  update: async (id: string, data: Partial<Repair>) => {
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now()
    };
    
    if (data.entryDate) {
      updateData.entryDate = Timestamp.fromDate(data.entryDate);
    }
    if (data.expectedCompletionDate) {
      updateData.expectedCompletionDate = Timestamp.fromDate(data.expectedCompletionDate);
    }
    if (data.completionDate) {
      updateData.completionDate = Timestamp.fromDate(data.completionDate);
    }
    
    await updateDoc(doc(db, 'repairs', id), updateData);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'repairs', id));
  }
};

// Part services
export const partService = {
  create: async (partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(collection(db, 'parts'), {
      ...partData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  getByClientId: async (clientId: string): Promise<Part[]> => {
    const q = query(
      collection(db, 'parts'), 
      where('clientId', '==', clientId),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Part[];
  },

  searchByCompatibility: async (compatibility: string, clientId: string): Promise<Part[]> => {
    const q = query(
      collection(db, 'parts'),
      where('compatibility', 'array-contains', compatibility),
      where('clientId', '==', clientId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Part[];
  },

  getById: async (id: string): Promise<Part | null> => {
    const docSnap = await getDoc(doc(db, 'parts', id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate()
      } as Part;
    }
    return null;
  },

  update: async (id: string, data: Partial<Part>) => {
    await updateDoc(doc(db, 'parts', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'parts', id));
  }
};
