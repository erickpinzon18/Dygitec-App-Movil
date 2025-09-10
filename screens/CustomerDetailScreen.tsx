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
import { equipmentService } from '../services/firebase';
import { EquipmentWithDetails, CustomerWithStats } from '../types';
import { CustomersStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { LoadingSpinner } from '../components/LoadingSpinner';

type CustomerDetailRouteProp = RouteProp<CustomersStackParamList, 'CustomerDetail'>;

export const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<CustomerDetailRouteProp>();
  const { customer } = route.params;
  const { client } = useAuth();
  
  const [equipments, setEquipments] = useState<EquipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEquipments = useCallback(async () => {
    if (!client?.id) return;
    
    try {
      const customerEquipments = await equipmentService.getByCustomerIdWithDetails(
        customer.id, 
        client.id
      );
      setEquipments(customerEquipments);
    } catch (error) {
      console.error('Error loading customer equipments:', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos del cliente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customer.id, client?.id]);

  useFocusEffect(
    useCallback(() => {
      loadEquipments();
    }, [loadEquipments])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEquipments();
  }, [loadEquipments]);

  const handleAddEquipment = () => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Equipments', {
        screen: 'NewEquipmentForm',
        params: {
          preselectedCustomer: customer
        }
      });
    }
  };

  const handleEquipmentPress = (equipment: EquipmentWithDetails) => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Equipments', {
        screen: 'EquipmentDetail',
        params: { equipment }
      });
    }
  };

  const getEquipmentStatusColor = (equipment: EquipmentWithDetails) => {
    if (equipment.activeRepairsCount > 0) {
      return colors.warning;
    }
    return colors.success;
  };

  const getEquipmentStatusText = (equipment: EquipmentWithDetails) => {
    if (equipment.activeRepairsCount > 0) {
      return `${equipment.activeRepairsCount} reparación(es) activa(s)`;
    }
    return 'Operativo';
  };

  const renderEquipmentItem = ({ item }: { item: EquipmentWithDetails }) => (
    <TouchableOpacity 
      style={styles.equipmentCard}
      onPress={() => handleEquipmentPress(item)}
    >
      <View style={styles.equipmentHeader}>
        <View style={styles.equipmentInfo}>
          <Text style={styles.equipmentBrand}>{item.brand}</Text>
          <Text style={styles.equipmentModel}>{item.model}</Text>
          {item.serialNumber && <Text style={styles.equipmentCode}>Serie: {item.serialNumber}</Text>}
          {item.year && <Text style={styles.equipmentYear}>Año: {item.year}</Text>}
        </View>
        <View style={styles.equipmentActions}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </View>
      
      <View style={styles.equipmentFooter}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getEquipmentStatusColor(item) }
        ]}>
          <Text style={styles.statusText}>
            {getEquipmentStatusText(item)}
          </Text>
        </View>
        
        <Text style={styles.repairCount}>
          {item.repairCount} reparaciones
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      {/* Customer Info Section */}
      <View style={styles.customerSection}>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
            {customer.phone && (
              <Text style={styles.customerPhone}>{customer.phone}</Text>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{customer.totalEquipments || equipments.length}</Text>
            <Text style={styles.statLabel}>Equipos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{customer.totalRepairs || 0}</Text>
            <Text style={styles.statLabel}>Reparaciones</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{customer.activeRepairs || 0}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
        </View>
      </View>

      {/* Equipment Section */}
      <View style={styles.equipmentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Equipos ({equipments.length})</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddEquipment}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {equipments.length > 0 ? (
          <FlatList
            data={equipments}
            renderItem={renderEquipmentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No hay equipos registrados</Text>
            <Text style={styles.emptyDescription}>
              Registra el primer equipo de este cliente
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddEquipment}
            >
              <Text style={styles.emptyButtonText}>Agregar Equipo</Text>
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
  customerSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customerEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  customerPhone: {
    ...typography.body,
    color: colors.textSecondary,
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
  equipmentSection: {
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
  equipmentBrand: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  equipmentModel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  equipmentCode: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  equipmentYear: {
    ...typography.caption,
    color: colors.textMuted,
  },
  equipmentActions: {
    justifyContent: 'center',
  },
  equipmentFooter: {
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
  repairCount: {
    ...typography.caption,
    color: colors.textMuted,
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
