import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RootStackParamList, RepairsStackParamList, PartsStackParamList, CustomersStackParamList, EquipmentsStackParamList, SettingsStackParamList, TabParamList } from '../types/navigation';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

// Main App Screens
import { RepairsScreen } from '../screens/RepairsScreen';
import { NewRepairScreen } from '../screens/NewRepairScreen';
import { RepairDetailScreen } from '../screens/RepairDetailScreen';
import { PartsScreen } from '../screens/PartsScreen';
import { NewPartScreen } from '../screens/NewPartScreen';
import { PartDetailScreen } from '../screens/PartDetailScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { NewCustomerForm } from '../screens/NewCustomerForm';
import { CustomerDetailScreen } from '../screens/CustomerDetailScreen';
import { EquipmentsScreen } from '../screens/EquipmentsScreen';
import { NewEquipmentForm } from '../screens/NewEquipmentForm';
import { EditEquipmentForm } from '../screens/EditEquipmentForm';
import { EquipmentDetailScreen } from '../screens/EquipmentDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BarcodeDisplayScreen } from '../screens/BarcodeDisplayScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';

import { colors } from '../constants/theme';

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const RepairsStack = createNativeStackNavigator<RepairsStackParamList>();
const PartsStack = createNativeStackNavigator<PartsStackParamList>();
const CustomersStack = createNativeStackNavigator<CustomersStackParamList>();
const EquipmentsStack = createNativeStackNavigator<EquipmentsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const RepairsNavigator = () => (
  <RepairsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <RepairsStack.Screen
      name="RepairsList"
      component={RepairsScreen}
      options={{ title: 'Reparaciones' }}
    />
    <RepairsStack.Screen
      name="NewRepair"
      component={NewRepairScreen}
      options={{ title: 'Nueva Reparación' }}
    />
    <RepairsStack.Screen
      name="RepairDetail"
      component={RepairDetailScreen}
      options={{ title: 'Detalle de Reparación' }}
    />
  </RepairsStack.Navigator>
);

const PartsNavigator = () => (
  <PartsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <PartsStack.Screen
      name="PartsList"
      component={PartsScreen}
      options={{ title: 'Piezas' }}
    />
    <PartsStack.Screen
      name="NewPart"
      component={NewPartScreen}
      options={{ title: 'Nueva Pieza' }}
    />
    <PartsStack.Screen
      name="PartDetail"
      component={PartDetailScreen}
      options={{ title: 'Detalle de Pieza' }}
    />
  </PartsStack.Navigator>
);

const SettingsNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <SettingsStack.Screen
      name="SettingsList"
      component={SettingsScreen}
      options={{ title: 'Configuración' }}
    />
  </SettingsStack.Navigator>
);

const CustomersNavigator = () => (
  <CustomersStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <CustomersStack.Screen
      name="CustomersList"
      component={CustomersScreen}
      options={{ title: 'Clientes' }}
    />
    <CustomersStack.Screen
      name="NewCustomerForm"
      component={NewCustomerForm}
      options={{ title: 'Nuevo Cliente' }}
    />
    <CustomersStack.Screen
      name="CustomerDetail"
      component={CustomerDetailScreen}
      options={{ title: 'Detalle del Cliente' }}
    />
  </CustomersStack.Navigator>
);

const EquipmentsNavigator = () => (
  <EquipmentsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <EquipmentsStack.Screen
      name="EquipmentsList"
      component={EquipmentsScreen}
      options={{ title: 'Equipos' }}
    />
    <EquipmentsStack.Screen
      name="NewEquipmentForm"
      component={NewEquipmentForm}
      options={{ title: 'Nuevo Equipo' }}
    />
    <EquipmentsStack.Screen
      name="EditEquipmentForm"
      component={EditEquipmentForm}
      options={{ title: 'Editar Equipo' }}
    />
    <EquipmentsStack.Screen
      name="EquipmentDetail"
      component={EquipmentDetailScreen}
      options={{ title: 'Detalle del Equipo' }}
    />
  </EquipmentsStack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;

        if (route.name === 'Repairs') {
          iconName = focused ? 'construct' : 'construct-outline';
        } else if (route.name === 'Parts') {
          iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
        } else if (route.name === 'Customers') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Equipments') {
          iconName = focused ? 'desktop' : 'desktop-outline';
        } else if (route.name === 'QR') {
          iconName = focused ? 'qr-code' : 'qr-code-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      },
    })}
  >
    <Tab.Screen
      name="Repairs"
      component={RepairsNavigator}
      options={{ title: 'Reparaciones' }}
    />
    <Tab.Screen
      name="Parts"
      component={PartsNavigator}
      options={{ title: 'Piezas' }}
    />
    <Tab.Screen
      name="Customers"
      component={CustomersNavigator}
      options={{ title: 'Clientes' }}
    />
    <Tab.Screen
      name="Equipments"
      component={EquipmentsNavigator}
      options={{ title: 'Equipos' }}
    />
    <Tab.Screen
      name="QR"
      component={QRScannerScreen}
      options={{ title: 'Escanear' }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsNavigator}
      options={{ title: 'Configuración' }}
    />
  </Tab.Navigator>
);

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="MainTabs" component={TabNavigator} />
    <AuthStack.Screen 
      name="BarcodeDisplay" 
      component={BarcodeDisplayScreen}
      options={{ 
        headerShown: true,
        title: 'Código QR',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    />
  </AuthStack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
