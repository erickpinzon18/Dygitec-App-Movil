import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  Alert
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { repairService } from '../services/firebase';
import { Repair, EquipmentWithDetails, RepairStatus } from '../types';
import { EquipmentsStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { LoadingSpinner } from '../components/LoadingSpinner';

type EquipmentDetailRouteProp = RouteProp<EquipmentsStackParamList, 'EquipmentDetail'>;

export const EquipmentDetailScreen = () => {
  const navigation = useNavigation<any>(); // Usar any temporalmente para evitar problemas de tipo
  const route = useRoute<EquipmentDetailRouteProp>();
  const { equipment } = route.params;
  const { client } = useAuth();
  
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRepairs = useCallback(async () => {
    if (!client?.id) return;
    
    try {
      const equipmentRepairs = await repairService.getByEquipmentId(
        equipment.id, 
        client.id
      );
      setRepairs(equipmentRepairs);
    } catch (error) {
      console.error('Error loading equipment repairs:', error);
      Alert.alert('Error', 'No se pudieron cargar las reparaciones del equipo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [equipment.id, client?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRepairs();
    }, [loadRepairs])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRepairs();
  }, [loadRepairs]);

  const handleAddRepair = () => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Repairs', {
        screen: 'NewRepair',
        params: { equipmentId: equipment.id }
      });
    }
  };

  const handleRepairPress = (repair: Repair) => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      // Aquí necesitaremos convertir Repair a RepairWithDetails
      // Por ahora navegamos con la reparación básica
      parentNavigation.navigate('Repairs', {
        screen: 'RepairDetail',
        params: { 
          repair: {
            ...repair,
            equipment: equipment,
            customer: equipment.customer
          }
        }
      });
    }
  };

  const getRepairStatusColor = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.PENDING:
        return colors.warning;
      case RepairStatus.IN_PROGRESS:
        return colors.primary;
      case RepairStatus.WAITING_PARTS:
        return colors.accent;
      case RepairStatus.COMPLETED:
        return colors.success;
      case RepairStatus.DELIVERED:
        return colors.success;
      case RepairStatus.CANCELLED:
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getRepairStatusText = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.PENDING:
        return 'Pendiente';
      case RepairStatus.IN_PROGRESS:
        return 'En Progreso';
      case RepairStatus.WAITING_PARTS:
        return 'Esperando Partes';
      case RepairStatus.COMPLETED:
        return 'Completada';
      case RepairStatus.DELIVERED:
        return 'Entregada';
      case RepairStatus.CANCELLED:
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  const getEquipmentStatusInfo = () => {
    const activeRepairs = repairs.filter(repair => 
      repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
    );

    if (activeRepairs.length > 0) {
      return {
        color: colors.warning,
        text: `${activeRepairs.length} reparación(es) activa(s)`,
        icon: 'warning-outline' as const
      };
    }

    return {
      color: colors.success,
      text: 'Operativo',
      icon: 'checkmark-circle-outline' as const
    };
  };

  const renderRepairItem = ({ item }: { item: Repair }) => (
    <TouchableOpacity 
      style={styles.repairCard}
      onPress={() => handleRepairPress(item)}
    >
      <View style={styles.repairHeader}>
        <View style={styles.repairInfo}>
          <Text style={styles.repairDescription}>{item.description}</Text>
          <Text style={styles.repairDate}>
            Entrada: {item.entryDate.toLocaleDateString('es-ES')}
          </Text>
          {item.expectedCompletionDate && (
            <Text style={styles.repairExpectedDate}>
              Estimada: {item.expectedCompletionDate.toLocaleDateString('es-ES')}
            </Text>
          )}
          {item.completionDate && (
            <Text style={styles.repairCompletionDate}>
              Completada: {item.completionDate.toLocaleDateString('es-ES')}
            </Text>
          )}
        </View>
        <View style={styles.repairActions}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </View>
      
      <View style={styles.repairFooter}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getRepairStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {getRepairStatusText(item.status)}
          </Text>
        </View>
        
        {item.cost && (
          <Text style={styles.repairCost}>
            ${item.cost.toLocaleString('es-ES')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const statusInfo = getEquipmentStatusInfo();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Equipment Info Section */}
      <View style={styles.equipmentSection}>
        <View style={styles.equipmentHeader}>
          <View style={styles.equipmentInfo}>
            <Text style={styles.equipmentName}>{equipment.brand} {equipment.model}</Text>
            <Text style={styles.customerName}>Cliente: {equipment.customer.name}</Text>
            {equipment.year && (
              <Text style={styles.equipmentDetail}>Año: {equipment.year}</Text>
            )}
            {equipment.serialNumber && (
              <Text style={styles.equipmentDetail}>Serie: {equipment.serialNumber}</Text>
            )}
            {equipment.description && (
              <Text style={styles.equipmentDescription}>{equipment.description}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditEquipmentForm', { equipment })}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Estado Actual</Text>
              <Text style={[styles.statusValue, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{repairs.length}</Text>
            <Text style={styles.statLabel}>Total Reparaciones</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {repairs.filter(r => r.status === RepairStatus.PENDING || r.status === RepairStatus.IN_PROGRESS).length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {repairs.filter(r => r.status === RepairStatus.COMPLETED || r.status === RepairStatus.DELIVERED).length}
            </Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>
      </View>

      {/* Repairs Section */}
      <View style={styles.repairsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reparaciones ({repairs.length})</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddRepair}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Nueva</Text>
          </TouchableOpacity>
        </View>

        {repairs.length > 0 ? (
          <FlatList
            data={repairs}
            renderItem={renderRepairItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No hay reparaciones registradas</Text>
            <Text style={styles.emptyDescription}>
              Registra la primera reparación de este equipo
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddRepair}
            >
              <Text style={styles.emptyButtonText}>Nueva Reparación</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  equipmentSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  equipmentInfo: {
    flex: 1,
  },
  editButton: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginLeft: spacing.md,
  },
  equipmentName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  equipmentDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  equipmentDescription: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  statusContainer: {
    marginBottom: spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statusTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  statusTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statusValue: {
    ...typography.body,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
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
  repairsSection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    ...typography.button,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  repairCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  repairInfo: {
    flex: 1,
  },
  repairDescription: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  repairDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  repairExpectedDate: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  repairCompletionDate: {
    ...typography.caption,
    color: colors.success,
  },
  repairActions: {
    justifyContent: 'center',
  },
  repairFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '600',
  },
  repairCost: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
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
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.card,
  },
});
