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
// import { FloatingActionButton } from '../components/FloatingActionButton';
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
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clientes..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{customers.length}</Text>
          <Text style={styles.summaryLabel}>Total Clientes</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {customers.reduce((total, customer) => total + customer.equipmentCount, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Equipos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {customers.reduce((total, customer) => total + customer.repairCount, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Reparaciones</Text>
        </View>
      </View>

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => loadCustomers(true)}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
            <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewCustomerForm')}
      >
        <Text style={styles.fabLabel}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
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
  clearButton: {
    padding: spacing.xs,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 5, // Space for FAB
  },
  customerCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  customerInfo: {
    flex: 1,
    marginRight: spacing.md,
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
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  registeredDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    right: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  fabLabel: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
