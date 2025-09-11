import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { customerService } from '../services/firebase';
import { CustomerWithStats } from '../types';
import { CustomersStackParamList } from '../types/navigation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type CustomersScreenProps = NativeStackScreenProps<CustomersStackParamList, 'CustomersList'>;

export const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const { client } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar clientes al montar el componente y cada vez que la pantalla se enfoque
  useFocusEffect(
    React.useCallback(() => {
      if (client) {
        loadCustomers();
      }
    }, [client])
  );

  // Filtrar clientes cuando cambie la búsqueda
  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = async (isRefreshing = false) => {
    if (!client) return;
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const customersData = await customerService.getWithStats(client.id);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  };

  const renderCustomerItem = ({ item }: { item: CustomerWithStats }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => {
        navigation.navigate('CustomerDetail', { customer: item });
      }}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerContact}>{item.phone}</Text>
          {item.email && (
            <Text style={styles.customerEmail}>{item.email}</Text>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.equipmentCount}</Text>
            <Text style={styles.statLabel}>Equipos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.repairCount}</Text>
            <Text style={styles.statLabel}>Reparaciones</Text>
          </View>
        </View>
      </View>

      <View style={styles.customerFooter}>
        <Text style={styles.registeredDate}>
          Registrado: {item.createdAt.toLocaleDateString('es-ES')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No hay clientes</Text>
      <Text style={styles.emptySubtitle}>
        Agrega tu primer cliente para comenzar
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Container */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{customers.length}</Text>
          <Text style={styles.statLabel}>Total Clientes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {customers.reduce((total, customer) => total + customer.equipmentCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Equipos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {customers.reduce((total, customer) => total + customer.repairCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Reparaciones</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          refreshing={refreshing}
          onRefresh={() => loadCustomers(true)}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filteredCustomers.length === 0 ? styles.emptyListContainer : undefined}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewCustomerForm')}
      >
        <Ionicons name="add" size={24} color={colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  flatList: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  customerCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customerContact: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  customerEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registeredDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
