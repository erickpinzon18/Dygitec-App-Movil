import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';
import { Client, User } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  client: Client | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  client: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndClientData = async (firebaseUserId: string) => {
    try {
      // Obtener información del usuario
      const userDoc = await getDoc(doc(db, 'users', firebaseUserId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        
        // Verificar si el usuario está habilitado (campo enabled debe ser true o undefined)
        if (userData.enabled === false) {
          Alert.alert(
            'Cuenta Deshabilitada',
            'Tu cuenta ha sido deshabilitada por el administrador. Contacta al administrador para más información.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await signOut(auth);
                }
              }
            ]
          );
          return;
        }
        
        setUser(userData);

        // Obtener información del cliente
        const clientDoc = await getDoc(doc(db, 'clients', userData.clientId));
        if (clientDoc.exists()) {
          const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
          setClient(clientData);
        }
      }
    } catch (error) {
      console.error('Error fetching user and client data:', error);
      setUser(null);
      setClient(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserAndClientData(firebaseUser.uid);
      } else {
        setUser(null);
        setClient(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, client, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
