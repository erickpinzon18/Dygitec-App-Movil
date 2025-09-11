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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { userService } from '../services/firebase';
import { User, UserType, getUserTypeDisplayText } from '../types';
import { SettingsStackParamList } from '../types/navigation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type UserManagementScreenProps = NativeStackScreenProps<SettingsStackParamList, 'UserManagement'>;

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation }) => {
  const { client, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (client) {
      loadUsers();
    }
  }, [client]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      if (client) {
        loadUsers();
      }
    }, [client])
  );

  const loadUsers = async (isRefreshing = false) => {
    if (!client) return;
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const usersData = await userService.getByClientId(client.id);
    //   console.log('Users loaded:', usersData); // Debug temporal
      
      // Migrar usuarios existentes que no tienen el campo enabled
      const usersToUpdate = usersData.filter(user => user.enabled === undefined);
      for (const user of usersToUpdate) {
        try {
          await userService.update(user.id, { enabled: true });
          console.log(`Updated user ${user.name} with enabled: true`);
        } catch (error) {
          console.error(`Error updating user ${user.name}:`, error);
        }
      }
      
      // Recargar datos si hubo actualizaciones
      if (usersToUpdate.length > 0) {
        const updatedUsersData = await userService.getByClientId(client.id);
        setUsers(updatedUsersData);
      } else {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getUserTypeText = (type: UserType) => {
    return getUserTypeDisplayText(type);
  };

  const getUserTypeColor = (type: UserType) => {
    switch (type) {
      case UserType.ADMIN:
        return colors.error;
      case UserType.WORKER:
        return colors.primary;
      case UserType.USER:
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.delete(userId);
              await loadUsers();
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const handleToggleUser = async (userId: string, currentEnabled: boolean, userName: string) => {
    // Prevenir que el usuario se deshabilite a sí mismo
    if (userId === user?.id && currentEnabled) {
      Alert.alert(
        'Acción No Permitida',
        'No puedes deshabilitarte a ti mismo.',
        [{ text: 'OK' }]
      );
      return;
    }

    const action = currentEnabled ? 'deshabilitar' : 'habilitar';
    const description = currentEnabled 
      ? `${userName} no podrá iniciar sesión en la aplicación.`
      : `${userName} podrá iniciar sesión en la aplicación nuevamente.`;
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
      `¿Estás seguro de que quieres ${action} a ${userName}?\n\n${description}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            setUpdatingUser(true);
            try {
              await userService.update(userId, { enabled: !currentEnabled });
              await loadUsers();
              Alert.alert('Éxito', `Usuario ${action}do correctamente`);
            } catch (error: any) {
              console.error('Error toggling user:', error);
              
              let errorMessage = `No se pudo ${action} el usuario`;
              
              if (error.message && error.message.includes('Usuario no encontrado')) {
                errorMessage = `Este usuario no existe en la base de datos. Es posible que haya sido eliminado.`;
              } else if (error.message && error.message.includes('No document to update')) {
                errorMessage = `El usuario no tiene datos completos en el sistema. Contacta al administrador.`;
              }
              
              Alert.alert('Error', errorMessage);
            } finally {
              setUpdatingUser(false);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getUserTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{getUserTypeText(item.type)}</Text>
          </View>
        </View>
        
        <View style={styles.userActions}>
          {/* Switch para habilitar/deshabilitar */}
          <View style={styles.switchContainer}>
            <Switch
              value={item.enabled ?? true}
              onValueChange={() => handleToggleUser(item.id, item.enabled ?? true, item.name)}
              trackColor={{ false: '#f4f3f4', true: colors.primaryLight }}
              thumbColor={item.enabled ? colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              style={styles.switch}
              disabled={item.id === user?.id} // Deshabilitar switch solo para el usuario actual
            />
            <Text style={[
              styles.switchLabel,
              { color: item.enabled ? colors.success : colors.error }
            ]}>
              {item.enabled ? 'Habilitado' : 'Deshabilitado'}
            </Text>
          </View>
          
          {/* Solo permitir eliminar si no es el usuario actual y no es admin
          {item.id !== user?.id && item.type !== UserType.ADMIN && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteUser(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </View>
  );

  const ListLoadingView = () => (
    <View style={styles.listLoadingContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.loadingText}>Cargando usuarios...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administrar Usuarios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewUser')}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        {/* Información de la empresa */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>Empresa: {client?.name}</Text>
        </View>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuarios..."
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
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.enabled !== false).length}
            </Text>
            <Text style={styles.statLabel}>Habilitados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.enabled === false).length}
            </Text>
            <Text style={styles.statLabel}>Deshabilitados</Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading && users.length === 0 ? (
          <ListLoadingView />
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={filteredUsers.length === 0 ? styles.emptyListContainer : styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadUsers(true)}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No hay usuarios</Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery 
                      ? 'No se encontraron usuarios con este nombre'
                      : 'Agrega el primer trabajador presionando el botón "+"'
                    }
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
      
      {/* Loading Overlay */}
      {updatingUser && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Actualizando usuario...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    marginTop: 30,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
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
    padding: spacing.lg,
  },
  userCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: `${colors.error}15`,
  },
  userClient: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
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
    paddingBottom: spacing.xxl,
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
    paddingVertical: spacing.xl * 3,
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
  companyInfo: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  companyName: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  switch: {
    marginBottom: spacing.xs,
    transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }], // Hacer el switch más grande
  },
  switchContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  switchLabel: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  disabledText: {
    ...typography.caption,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.md,
  },
  loadingOverlayText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: '600',
  },
});
