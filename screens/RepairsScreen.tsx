import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { repairService, customerService, computerService } from '../services/firebase';
import { Repair, RepairWithDetails, RepairStatus } from '../types';
import { RepairsStackParamList } from '../types/navigation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type RepairsScreenProps = NativeStackScreenProps<RepairsStackParamList, 'RepairsList'>;

export const RepairsScreen: React.FC<RepairsScreenProps> = ({ navigation }) => {
  const { client } = useAuth();
  const [repairs, setRepairs] = useState<RepairWithDetails[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<RepairWithDetails[]>([]);
  const [loading, setLoading] = useState(false); // Cambiado a false para evitar loader inicial
  const [refreshing, setRefreshing] = useState(false); // Estado separado para pull-to-refresh
  const [filter, setFilter] = useState<'all' | RepairStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar reparaciones cuando cambie el filtro
  useEffect(() => {
    if (client) {
      loadRepairs();
    }
  }, [filter, client]);

  // Carga inicial cuando se monta el componente
  useEffect(() => {
    if (client) {
      loadRepairs();
    }
  }, [client]);

  // Filtrar reparaciones cuando cambien los parámetros de búsqueda
  useEffect(() => {
    filterRepairs();
  }, [repairs, searchQuery, filter]);

  // Recargar datos cada vez que la pantalla se enfoque (para ver cambios actualizados)
  useFocusEffect(
    React.useCallback(() => {
      if (client) {
        loadRepairs();
      }
    }, [filter, client])
  );

  const loadRepairs = async (isRefreshing = false) => {
    if (!client) return;
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      let repairsData: Repair[];
      
      if (filter === 'all') {
        repairsData = await repairService.getByClientId(client.id);
      } else {
        repairsData = await repairService.getByStatus(filter, client.id);
      }

      // Load customer and computer details for each repair
      const repairsWithDetails: RepairWithDetails[] = await Promise.all(
        repairsData.map(async (repair) => {
          const [customer, computer] = await Promise.all([
            customerService.getById(repair.customerId),
            computerService.getById(repair.computerId),
          ]);

          return {
            ...repair,
            customer: customer!,
            computer: computer!,
          };
        })
      );

      setRepairs(repairsWithDetails);
    } catch (error) {
      console.error('Error loading repairs:', error);
      Alert.alert('Error', 'No se pudieron cargar las reparaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterRepairs = () => {
    let filtered = repairs;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(repair => repair.status === filter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(repair =>
        repair.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repair.customer.email && repair.customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        repair.customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.computer.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.computer.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repair.computer.serialNumber && repair.computer.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (repair.notes && repair.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredRepairs(filtered);
  };

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.PENDING:
        return colors.warning;
      case RepairStatus.IN_PROGRESS:
        return colors.primary;
      case RepairStatus.WAITING_PARTS:
        return colors.secondary;
      case RepairStatus.COMPLETED:
        return colors.success;
      case RepairStatus.DELIVERED:
        return colors.textMuted;
      case RepairStatus.CANCELLED:
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  const getStatusText = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.PENDING:
        return 'Pendiente';
      case RepairStatus.IN_PROGRESS:
        return 'En Progreso';
      case RepairStatus.WAITING_PARTS:
        return 'Esperando Piezas';
      case RepairStatus.COMPLETED:
        return 'Completada';
      case RepairStatus.DELIVERED:
        return 'Entregada';
      case RepairStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  const renderRepairItem = ({ item }: { item: RepairWithDetails }) => (
    <TouchableOpacity
      style={styles.repairCard}
      onPress={() => navigation.navigate('RepairDetail', { repair: item })}
    >
      <View style={styles.repairHeader}>
        <Text style={styles.repairTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customer.name}</Text>
      <Text style={styles.computerInfo}>
        {item.computer.brand} {item.computer.model}
      </Text>

      <View style={styles.repairFooter}>
        <Text style={styles.entryDate}>
          Entrada: {item.entryDate.toLocaleDateString('es-ES')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ status, title }: { status: 'all' | RepairStatus; title: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === status && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === status && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Componente de loading para el área de la lista
  const ListLoadingView = () => (
    <View style={styles.listLoadingContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.loadingText}>Cargando reparaciones...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registros</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewRepair')}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar reparaciones..."
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

      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          <FilterButton status="all" title="Todas" />
          <FilterButton status={RepairStatus.PENDING} title="Pendientes" />
          <FilterButton status={RepairStatus.IN_PROGRESS} title="En Progreso" />
          <FilterButton status={RepairStatus.WAITING_PARTS} title="Esperando Piezas" />
          <FilterButton status={RepairStatus.COMPLETED} title="Completadas" />
          <FilterButton status={RepairStatus.DELIVERED} title="Entregadas" />
          <FilterButton status={RepairStatus.CANCELLED} title="Canceladas" />
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        {loading && repairs.length === 0 ? (
          <ListLoadingView />
        ) : (
          <FlatList
            data={filteredRepairs}
            renderItem={renderRepairItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={filteredRepairs.length === 0 ? styles.emptyListContainer : styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadRepairs(true)}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="construct-outline" size={64} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No hay reparaciones</Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery || filter !== 'all' 
                      ? 'No se encontraron reparaciones con estos filtros'
                      : 'Agrega tu primera reparación presionando el botón "+"'
                    }
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersScrollContent: {
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.lg,
    marginBottom: spacing.xl * 5, 
  },
  repairCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  repairTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  customerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  computerInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  repairFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // Estilos para el loading optimizado
  listLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  flatListContent: {
    paddingBottom: spacing.xxl + spacing.lg, // Más espacio para evitar que se corte con el footer
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 5,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
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
});
