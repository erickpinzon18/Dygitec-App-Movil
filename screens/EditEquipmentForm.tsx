import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentService, customerService } from '../services/firebase';
import { Equipment, Customer, EquipmentWithDetails } from '../types';
import { EquipmentsStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, shadows } from '../constants/theme';

type EditEquipmentRouteProp = RouteProp<EquipmentsStackParamList, 'EditEquipmentForm'>;

export const EditEquipmentForm: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditEquipmentRouteProp>();
  const { equipment } = route.params;
  const { user, client } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(equipment.customer);
  const [customerSearchText, setCustomerSearchText] = useState('');
  
  const [formData, setFormData] = useState({
    brand: equipment.brand || '',
    model: equipment.model || '',
    year: equipment.year?.toString() || '',
    serialNumber: equipment.serialNumber || '',
    description: equipment.description || '',
    customerId: equipment.customerId || '',
    notes: '',
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadCustomers();
  }, [client?.id]);

  // Recargar clientes cuando la pantalla toma foco (usuario regresa de crear cliente)
  useFocusEffect(
    React.useCallback(() => {
      loadCustomers();
    }, [client?.id])
  );

  // Filtrar clientes cuando cambie el texto de búsqueda
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

  const loadCustomers = async () => {
    if (!client?.id) return;
    
    try {
      const customersData = await customerService.getByClientId(client.id);
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setShowCustomerModal(false);
    setCustomerSearchText('');
  };

  const handleCreateNewCustomer = () => {
    setShowCustomerModal(false);
    // Navegar al parent navigator y luego al stack de customers
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Customers', {
        screen: 'NewCustomerForm'
      });
    }
  };

  const validateForm = () => {
    if (!formData.brand.trim()) {
      Alert.alert('Error', 'La marca es requerida');
      return false;
    }
    if (!formData.model.trim()) {
      Alert.alert('Error', 'El modelo es requerido');
      return false;
    }
    if (!selectedCustomer) {
      Alert.alert('Error', 'Debe seleccionar un cliente');
      return false;
    }
    // Validar año si está presente
    if (formData.year.trim() && isNaN(Number(formData.year))) {
      Alert.alert('Error', 'El año debe ser un número válido');
      return false;
    }
    if (formData.year.trim() && Number(formData.year) < 1900) {
      Alert.alert('Error', 'El año debe ser mayor a 1900');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user || !client) return;
    
    setIsLoading(true);
    try {
      const equipmentData: Partial<Equipment> = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: formData.year.trim() ? Number(formData.year) : undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        description: formData.description.trim() || undefined,
        customerId: selectedCustomer!.id,
        registerBy: user.id,
      };

      await equipmentService.update(equipment.id, equipmentData);
      
      Alert.alert(
        'Éxito', 
        'Equipo actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating equipment:', error);
      Alert.alert('Error', 'No se pudo actualizar el equipo');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerItem}
      onPress={() => handleSelectCustomer(item)}
    >
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerContact}>{item.phone}</Text>
        {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Editar Equipo</Text>
          <Text style={styles.subtitle}>Modifica la información del equipo</Text>

          {/* Información del Equipo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Equipo</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>Marca *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.brand}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, brand: text }))}
                  placeholder="Ej: Dell, HP, Lenovo"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Modelo *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.model}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}
                  placeholder="Ej: Inspiron 15"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>Año</Text>
                <TextInput
                  style={styles.input}
                  value={formData.year}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, year: text }))}
                  placeholder="Ej: 2023"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Número de Serie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.serialNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, serialNumber: text }))}
                  placeholder="Ej: ABC123456"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Descripción adicional del equipo..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Selección de Cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente *</Text>
            
            <TouchableOpacity 
              style={styles.customerSelector}
              onPress={() => setShowCustomerModal(true)}
            >
              {selectedCustomer ? (
                <View style={styles.selectedCustomer}>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerSelectedName}>{selectedCustomer.name}</Text>
                    <Text style={styles.customerSelectedContact}>{selectedCustomer.phone}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </View>
              ) : (
                <View style={styles.customerPlaceholder}>
                  <Text style={styles.customerPlaceholderText}>Seleccionar cliente</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Actualizando...' : 'Actualizar Equipo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Selección de Cliente */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity
              onPress={() => {
                setShowCustomerModal(false);
                setCustomerSearchText('');
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.textSecondary}
                value={customerSearchText}
                onChangeText={setCustomerSearchText}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Lista de Clientes */}
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            style={styles.customerList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No se encontraron clientes</Text>
                {customerSearchText.trim() === '' && (
                  <TouchableOpacity 
                    style={styles.createCustomerButton}
                    onPress={handleCreateNewCustomer}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={styles.createCustomerText}>Crear Nuevo Cliente</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          {/* Botón Crear Cliente */}
          {filteredCustomers.length > 0 && (
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.createCustomerButton}
                onPress={handleCreateNewCustomer}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.createCustomerText}>Crear Nuevo Cliente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  customerSelector: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  selectedCustomer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerDetails: {
    flex: 1,
  },
  customerSelectedName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  customerSelectedContact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  customerPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerPlaceholderText: {
    ...typography.body,
    color: colors.placeholder,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  searchContainer: {
    padding: spacing.lg,
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
  customerList: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  customerContact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  customerEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  createCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  createCustomerText: {
    ...typography.button,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
});
