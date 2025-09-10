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
// import { FloatingActionButton } from '../components/FloatingActionButton';
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
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar equipos..."
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
          <Text style={styles.summaryNumber}>{equipments.length}</Text>
          <Text style={styles.summaryLabel}>Total Equipos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {equipments.reduce((total, equipment) => {
              const activeRepairs = equipment.repairs.filter(repair => 
                repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
              ).length;
              return total + activeRepairs;
            }, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Reparaciones Activas</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {equipments.reduce((total, equipment) => total + equipment.repairCount, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Reparaciones</Text>
        </View>
      </View>

      {/* Equipments List */}
      <FlatList
        data={filteredEquipments}
        renderItem={renderEquipmentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => loadEquipments(true)}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
            {/* <FloatingActionButton
        onPress={() => navigation.navigate('NewEquipment')}
        icon="plus"
        color="white"
      /> */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewEquipmentForm', {})}
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
  equipmentCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  equipmentInfo: {
    flex: 1,
    marginRight: spacing.md,
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
    fontFamily: 'monospace',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    maxWidth: 120,
  },
  statusText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    textAlign: 'center',
  },
  equipmentFooter: {
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
    flex: 1,
  },
  lastRepair: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
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
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  fabLabel: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
