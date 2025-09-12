import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { repairService, customerService, equipmentService } from '../services/firebase';
import { RepairStatus, Priority, Customer, Equipment } from '../types';
import { RepairsStackParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type NewRepairRouteProp = RouteProp<RepairsStackParamList, 'NewRepair'>;
type NewRepairScreenProps = NativeStackScreenProps<RepairsStackParamList, 'NewRepair'>;

export const NewRepairScreen: React.FC<NewRepairScreenProps> = ({ navigation }) => {
  const route = useRoute<NewRepairRouteProp>();
  const { equipmentId } = route.params || {};
  const { client, user } = useAuth();
  
  // Estados para los selectores
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  
  // Estados para modales
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [equipmentSearchText, setEquipmentSearchText] = useState('');
  
  // Estados para selecciones
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    expectedDays: '',
    cost: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [client?.id, equipmentId]);

  // Recargar cuando la pantalla toma foco
  useFocusEffect(
    useCallback(() => {
      if (client?.id) {
        loadCustomers();
        // Si hay un cliente seleccionado, también recargar sus equipos
        if (selectedCustomer) {
          loadEquipmentsByCustomer(selectedCustomer.id);
        }
      }
    }, [client?.id, selectedCustomer?.id])
  );

  // Filtrar clientes
  useEffect(() => {
    if (customerSearchText.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchText.toLowerCase()) ||
        customer.phone.toLowerCase().includes(customerSearchText.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearchText.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, customerSearchText]);

  // Filtrar equipos
  useEffect(() => {
    if (equipmentSearchText.trim() === '') {
      setFilteredEquipments(equipments);
    } else {
      const filtered = equipments.filter(equipment => 
        equipment.brand.toLowerCase().includes(equipmentSearchText.toLowerCase()) ||
        equipment.model.toLowerCase().includes(equipmentSearchText.toLowerCase()) ||
        (equipment.serialNumber && equipment.serialNumber.toLowerCase().includes(equipmentSearchText.toLowerCase()))
      );
      setFilteredEquipments(filtered);
    }
  }, [equipments, equipmentSearchText]);

  const loadInitialData = async () => {
    if (!client?.id) return;
    
    setLoadingData(true);
    try {
      await loadCustomers();
      
      if (equipmentId) {
        // Viene desde equipos - cargar equipo específico
        const equipment = await equipmentService.getById(equipmentId);
        if (equipment) {
          setSelectedEquipment(equipment);
          const customer = await customerService.getById(equipment.customerId);
          if (customer) {
            setSelectedCustomer(customer);
          }
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCustomers = async () => {
    if (!client?.id) return;
    
    try {
      const customersData = await customerService.getByClientId(client.id);
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadEquipmentsByCustomer = async (customerId: string) => {
    if (!client?.id) return;
    
    setLoadingEquipments(true);
    try {
      const equipmentsData = await equipmentService.getByCustomerId(customerId, client.id);
      setEquipments(equipmentsData);
      setFilteredEquipments(equipmentsData);
    } catch (error) {
      console.error('Error loading equipments:', error);
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedEquipment(null); // Reset equipo cuando cambia cliente
    setShowCustomerModal(false);
    setCustomerSearchText('');
    
    // Cargar equipos del cliente seleccionado
    await loadEquipmentsByCustomer(customer.id);
  };

  const handleSelectEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentModal(false);
    setEquipmentSearchText('');
  };

  const handleCreateNewCustomer = () => {
    setShowCustomerModal(false);
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Customers', {
        screen: 'NewCustomerForm'
      });
    }
  };

  const handleCreateNewEquipment = () => {
    setShowEquipmentModal(false);
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Equipments', {
        screen: 'NewEquipmentForm',
        params: {
          preselectedCustomer: selectedCustomer
        }
      });
    }
  };

  const handleOpenEquipmentModal = async () => {
    if (!selectedCustomer) return;
    
    // Limpiar búsqueda anterior y mostrar el modal inmediatamente
    setEquipmentSearchText('');
    setShowEquipmentModal(true);
    
    // Recargar equipos del cliente después de abrir el modal
    await loadEquipmentsByCustomer(selectedCustomer.id);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedCustomer) {
      newErrors.customer = 'Debe seleccionar un cliente';
    }
    if (!selectedEquipment) {
      newErrors.equipment = 'Debe seleccionar un equipo';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'El título de la reparación es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedCustomer || !selectedEquipment) return;

    setLoading(true);
    try {
      // Calculate expected completion date
      const expectedCompletionDate = new Date();
      if (formData.expectedDays) {
        expectedCompletionDate.setDate(
          expectedCompletionDate.getDate() + parseInt(formData.expectedDays)
        );
      }

      // Create repair
      const repairId = await repairService.create({
        clientId: client!.id,
        registerBy: user!.id,
        customerId: selectedCustomer.id,
        equipmentId: selectedEquipment.id,
        title: formData.title,
        description: formData.description,
        status: RepairStatus.PENDING,
        priority: formData.priority,
        entryDate: new Date(),
        expectedCompletionDate: formData.expectedDays ? expectedCompletionDate : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes || '',
      });

      // Crear el objeto RepairWithDetails para navegar al detalle
      const currentDate = new Date();
      const newRepair = {
        id: repairId,
        clientId: client!.id,
        registerBy: user!.id,
        customerId: selectedCustomer.id,
        equipmentId: selectedEquipment.id,
        title: formData.title,
        description: formData.description,
        status: RepairStatus.PENDING,
        priority: formData.priority,
        entryDate: new Date(),
        expectedCompletionDate: formData.expectedDays ? expectedCompletionDate : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes || '',
        createdAt: currentDate,
        updatedAt: currentDate,
        customer: selectedCustomer,
        equipment: selectedEquipment,
      };

      Alert.alert(
        'Éxito', 
        'Reparación registrada exitosamente',
        [
          {
            text: 'Ver Detalles',
            onPress: () => {
              // Resetear el stack para que regrese directamente a la lista
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'RepairsList' },
                  { name: 'RepairDetail', params: { repair: newRepair } },
                ],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating repair:', error);
      Alert.alert('Error', 'No se pudo registrar la reparación');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => handleSelectCustomer(item)}
    >
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemName}>{item.name}</Text>
        <Text style={styles.listItemContact}>{item.phone}</Text>
        {item.email && <Text style={styles.listItemEmail}>{item.email}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderEquipmentItem = ({ item }: { item: Equipment }) => (
    <TouchableOpacity 
      style={styles.customerItem}
      onPress={() => handleSelectEquipment(item)}
    >
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.brand} {item.model}</Text>
        {item.year && <Text style={styles.customerPhone}>Año: {item.year}</Text>}
        {item.serialNumber && <Text style={styles.customerEmail}>S/N: {item.serialNumber}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Nueva Reparación</Text>
          <Text style={styles.subtitle}>
            {equipmentId ? 'Complete la información de la reparación' : 'Seleccione cliente y equipo para la reparación'}
          </Text>

          {/* Selección de Cliente */}
          {!equipmentId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cliente *</Text>
              
              <TouchableOpacity
                style={[styles.customerSelector, errors.customer && styles.customerSelectorError]}
                onPress={() => {
                  setCustomerSearchText('');
                  setShowCustomerModal(true);
                }}
              >
                <View style={styles.customerSelectorContent}>
                  {selectedCustomer ? (
                    <>
                      <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                      <Text style={styles.selectedCustomerPhone}>{selectedCustomer.phone}</Text>
                    </>
                  ) : (
                    <Text style={styles.customerPlaceholder}>Seleccionar cliente</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {errors.customer && <Text style={styles.errorText}>{errors.customer}</Text>}
            </View>
          )}

          {/* Mostrar cliente seleccionado si viene desde equipos */}
          {equipmentId && selectedCustomer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cliente</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardName}>{selectedCustomer.name}</Text>
                <Text style={styles.infoCardContact}>{selectedCustomer.phone}</Text>
                {selectedCustomer.email && <Text style={styles.infoCardEmail}>{selectedCustomer.email}</Text>}
              </View>
            </View>
          )}

          {/* Selección de Equipo */}
          {selectedCustomer && !equipmentId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipo *</Text>
              
              <TouchableOpacity 
                style={[styles.selector, errors.equipment && styles.selectorError]}
                onPress={handleOpenEquipmentModal}
              >
                {selectedEquipment ? (
                  <View style={styles.selectedItem}>
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{selectedEquipment.brand} {selectedEquipment.model}</Text>
                      {selectedEquipment.year && <Text style={styles.selectedItemContact}>Año: {selectedEquipment.year}</Text>}
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </View>
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Seleccionar equipo</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>
              {errors.equipment && <Text style={styles.errorText}>{errors.equipment}</Text>}
            </View>
          )}

          {/* Mostrar equipo seleccionado si viene desde equipos */}
          {equipmentId && selectedEquipment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipo</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardName}>{selectedEquipment.brand} {selectedEquipment.model}</Text>
                {selectedEquipment.year && <Text style={styles.infoCardContact}>Año: {selectedEquipment.year}</Text>}
                {selectedEquipment.serialNumber && <Text style={styles.infoCardEmail}>S/N: {selectedEquipment.serialNumber}</Text>}
              </View>
            </View>
          )}

          {/* Información de la Reparación */}
          {((selectedCustomer && selectedEquipment) || equipmentId) && (
            <>
              <Text style={styles.sectionTitle}>Información de la Reparación</Text>

              <InputField
                label="Título de la reparación *"
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                error={errors.title}
                placeholder="Problema principal"
              />

              <InputField
                label="Descripción del problema *"
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                error={errors.description}
                multiline
                numberOfLines={4}
                placeholder="Describe detalladamente el problema"
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Prioridad</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.priority}
                    onValueChange={(value: Priority) => updateFormData('priority', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Baja" value={Priority.LOW} />
                    <Picker.Item label="Media" value={Priority.MEDIUM} />
                    <Picker.Item label="Alta" value={Priority.HIGH} />
                    <Picker.Item label="Urgente" value={Priority.URGENT} />
                  </Picker>
                </View>
              </View>

              <InputField
                label="Días estimados (opcional)"
                value={formData.expectedDays}
                onChangeText={(value) => updateFormData('expectedDays', value)}
                keyboardType="numeric"
                placeholder="5"
              />

              <InputField
                label="Costo estimado (opcional)"
                value={formData.cost}
                onChangeText={(value) => updateFormData('cost', value)}
                keyboardType="numeric"
                placeholder="0.00"
              />

              <InputField
                label="Notas adicionales (opcional)"
                value={formData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                multiline
                numberOfLines={3}
                placeholder="Información adicional"
              />

              <Button
                title={loading ? 'Registrando...' : 'Registrar Reparación'}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.submitButton}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Selección de Cliente */}
      <Modal
        visible={showCustomerModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity
                onPress={() => setShowCustomerModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o teléfono"
                placeholderTextColor={colors.textSecondary}
                value={customerSearchText}
                onChangeText={setCustomerSearchText}
              />
              {customerSearchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setCustomerSearchText('')}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.customerListContainer}>
              <Text style={styles.customerListTitle}>
                {customerSearchText.trim() 
                  ? `${filteredCustomers.length} cliente(s) encontrado(s)`
                  : `${customers.length} cliente(s) registrado(s)`
                }
              </Text>
              
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.customerItem}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      <Text style={styles.customerPhone}>{item.phone}</Text>
                      {item.email && item.email.trim() && (
                        <Text style={styles.customerEmail}>{item.email}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                style={styles.customerList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyStateTitle}>
                      {customerSearchText.trim() ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </Text>
                    <Text style={styles.emptyStateSubtitle}>
                      {customerSearchText.trim() 
                        ? 'Intenta con otro término de búsqueda'
                        : 'Crea tu primer cliente usando el botón de abajo'
                      }
                    </Text>
                  </View>
                )}
              />
            </View>

            <TouchableOpacity
              style={styles.newClientButton}
              onPress={handleCreateNewCustomer}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.newClientButtonText}>Crear Nuevo Cliente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Selección de Equipo */}
      <Modal
        visible={showEquipmentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Equipo</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEquipmentModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                value={equipmentSearchText}
                onChangeText={setEquipmentSearchText}
                placeholder="Buscar equipo por modelo, marca o serial..."
                style={styles.searchInput}
                placeholderTextColor={colors.textSecondary}
              />
              {equipmentSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setEquipmentSearchText('')}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.equipmentListContainer}>
              <Text style={styles.equipmentListTitle}>
                {loadingEquipments 
                  ? 'Actualizando lista...'
                  : `${filteredEquipments.length} equipo${filteredEquipments.length !== 1 ? 's' : ''} encontrado${filteredEquipments.length !== 1 ? 's' : ''}`
                }
              </Text>
              <FlatList
                data={filteredEquipments}
                renderItem={renderEquipmentItem}
                keyExtractor={(item) => item.id}
                style={styles.equipmentList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => {
                  if (loadingEquipments) {
                    return (
                      <View style={styles.emptyState}>
                        <Ionicons name="refresh" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyStateTitle}>Cargando equipos...</Text>
                        <Text style={styles.emptyStateSubtitle}>Actualizando la lista de equipos del cliente</Text>
                      </View>
                    );
                  }
                  
                  return (
                    <View style={styles.emptyState}>
                      <Ionicons name="desktop-outline" size={64} color={colors.textSecondary} />
                      <Text style={styles.emptyStateTitle}>
                        {equipmentSearchText.trim() ? 'No se encontraron equipos' : 'No hay equipos registrados'}
                      </Text>
                      <Text style={styles.emptyStateSubtitle}>
                        {equipmentSearchText.trim() 
                          ? 'Intenta con otro término de búsqueda o registra un nuevo equipo'
                          : selectedCustomer 
                            ? 'Este cliente no tiene equipos registrados. Crea el primer equipo usando el botón de abajo'
                            : 'Selecciona un cliente primero para ver sus equipos'
                        }
                      </Text>
                    </View>
                  );
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.newEquipmentButton}
              onPress={handleCreateNewEquipment}
            >
              <Ionicons name="desktop" size={20} color="white" />
              <Text style={styles.newEquipmentButtonText}>Registrar Nuevo Equipo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  customerSelectorError: {
    borderColor: colors.error,
  },
  customerSelectorContent: {
    flex: 1,
  },
  selectedCustomerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  selectedCustomerPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  selector: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  selectedItemContact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    ...typography.body,
    color: colors.textMuted,
  },
  infoCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  infoCardContact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoCardEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  picker: {
    // height: 44,
    color: colors.text,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  customerListContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  customerListTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  customerInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  customerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  customerPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
    fontStyle: 'italic',
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  newClientButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
    ...shadows.sm,
  },
  newClientButtonText: {
    ...typography.button,
    color: 'white',
    marginLeft: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  listItemContact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listItemEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createButtonText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  modalFooter: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Equipment modal styles  
  equipmentListContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  equipmentListTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  equipmentList: {
    flex: 1,
  },
  newEquipmentButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
    ...shadows.sm,
  },
  newEquipmentButtonText: {
    ...typography.button,
    color: 'white',
    marginLeft: spacing.sm,
  },
});