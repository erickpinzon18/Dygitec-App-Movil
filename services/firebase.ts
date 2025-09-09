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
import { Client, User, Customer, Computer, Repair, Part, RepairWithDetails } from '../types';

// Authentication services
export const authService = {
  signUp: async (email: string, password: string, name: string, clientId: string, userType: string = 'user') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document with clientId
    await addDoc(collection(db, 'users'), {
      id: user.uid,
      clientId,
      name,
      type: userType
    });
    
    return user;
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

// Computer services
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
