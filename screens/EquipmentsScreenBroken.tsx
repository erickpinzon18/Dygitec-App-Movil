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
import { equipmentService, customerService } from '../services/firebase';
import { EquipmentWithDetails, RepairStatus } from '../types';
import { EquipmentsStackParamList } from '../types/navigation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type EquipmentsScreenProps = NativeStackScreenProps<EquipmentsStackParamList, 'EquipmentsList'>;

export const EquipmentsScreen: React.FC<EquipmentsScreenProps> = ({ navigation }) => {
  const { client } = useAuth();
  const [equipments, setEquipments] = useState<EquipmentWithDetails[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<EquipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar equipos al montar el componente y cada vez que la pantalla se enfoque
  useFocusEffect(
    React.useCallback(() => {
      if (client) {
        loadEquipments();
      }
    }, [client])
  );

  // Filtrar equipos cuando cambie la búsqueda
  useEffect(() => {
    filterEquipments();
  }, [equipments, searchQuery]);

  const loadEquipments = async (isRefreshing = false) => {
    if (!client) return;
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const equipmentsData = await equipmentService.getWithDetails(client.id);
      setEquipments(equipmentsData);
    } catch (error) {
      console.error('Error loading equipments:', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterEquipments = () => {
    let filtered = equipments;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(equipment =>
        equipment.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (equipment.serialNumber && equipment.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        equipment.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEquipments(filtered);
  };

  const getStatusColor = (equipment: EquipmentWithDetails) => {
    const activeRepairs = equipment.repairs.filter(repair => 
      repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
    ).length;
    
    if (activeRepairs > 0) {
      return colors.warning;
    }
    if (equipment.repairCount > 0) {
      return colors.success;
    }
    return colors.textSecondary;
  };

  const getStatusText = (equipment: EquipmentWithDetails) => {
    const activeRepairs = equipment.repairs.filter(repair => 
      repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
    ).length;
    
    if (activeRepairs > 0) {
      return `${activeRepairs} reparación${activeRepairs > 1 ? 'es' : ''} activa${activeRepairs > 1 ? 's' : ''}`;
    }
    if (equipment.repairCount > 0) {
      return `${equipment.repairCount} reparación${equipment.repairCount > 1 ? 'es' : ''} histórica${equipment.repairCount > 1 ? 's' : ''}`;
    }
    return 'Sin reparaciones';
  };

  const renderEquipmentItem = ({ item }: { item: EquipmentWithDetails }) => (
    <TouchableOpacity
      style={styles.equipmentCard}
      onPress={() => {
        navigation.navigate('EquipmentDetail', { equipment: item });
      }}
    >
      <View style={styles.equipmentHeader}>
        <View style={styles.equipmentInfo}>
          <Text style={styles.equipmentName}>{item.brand} {item.model}</Text>
          <Text style={styles.customerName}>Cliente: {item.customer.name}</Text>
          {item.year && (
            <Text style={styles.equipmentYear}>Año: {item.year}</Text>
          )}
          {item.serialNumber && (
            <Text style={styles.serialNumber}>S/N: {item.serialNumber}</Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
            <Text style={styles.statusText} numberOfLines={2}>
              {getStatusText(item)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.equipmentFooter}>
        <Text style={styles.registeredDate}>
          Registrado: {item.createdAt.toLocaleDateString('es-ES')}
        </Text>
        {item.lastRepairDate && (
          <Text style={styles.lastRepair}>
            Última reparación: {item.lastRepairDate.toLocaleDateString('es-ES')}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="desktop-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No hay equipos</Text>
      <Text style={styles.emptySubtitle}>
        Agrega tu primer equipo para comenzar a gestionar reparaciones
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Equipos</Text>
        
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar equipos..."
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

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{equipments.length}</Text>
            <Text style={styles.statLabel}>Total Equipos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {equipments.reduce((total, equipment) => {
                const activeRepairs = equipment.repairs.filter(repair => 
                  repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
                ).length;
                return total + activeRepairs;
              }, 0)}
            </Text>
            <Text style={styles.statLabel}>Reparaciones Activas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {equipments.reduce((total, equipment) => total + equipment.repairCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Reparaciones</Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={filteredEquipments}
          renderItem={renderEquipmentItem}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          refreshing={refreshing}
          onRefresh={() => loadEquipments(true)}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filteredEquipments.length === 0 ? styles.emptyListContainer : undefined}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewEquipmentForm', {})}
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
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
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
  },
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
  equipmentCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  equipmentYear: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  serialNumber: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statusContainer: {
    marginLeft: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    maxWidth: 120,
  },
  statusText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 10,
  },
  equipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registeredDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  lastRepair: {
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
