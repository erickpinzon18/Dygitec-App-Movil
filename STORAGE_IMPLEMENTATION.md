# Firebase Storage Implementation - Evidencias Fotográficas

## 🎯 Estructura Implementada

### Organización de Carpetas
```
/clients/{clientId}/customers/{customerId}/equipment/{equipmentId}/repairs/{repairId}/photo_{timestamp}.jpg
```

**Ejemplo real:**
```
/clients/dygitec-001/customers/customer-123/equipment/equipment-456/repairs/repair-789/photo_1694567890123.jpg
```

## 🔧 Configuración Agregada

### 1. Firebase Config (`config/firebase.ts`)
- ✅ Agregado `import { getStorage } from 'firebase/storage'`
- ✅ Agregado `export const storage = getStorage(app)`

### 2. Firebase Service (`services/firebase.ts`)
- ✅ Importaciones de Storage agregadas
- ✅ Servicio completo `storageService` implementado

### 3. Tipos (`types/index.ts`)
- ✅ `EvidencePhoto` interface
- ✅ `EvidenceUploadProgress` interface

### 4. RepairDetailScreen (`screens/RepairDetailScreen.tsx`)
- ✅ Integración completa con Firebase Storage
- ✅ UI para evidencias guardadas vs pendientes
- ✅ Progress tracking durante uploads
- ✅ Estados separados para local/cloud

## 📱 Funciones Principales

### `storageService.uploadEvidencePhoto()`
- Sube una foto individual
- Genera path estructurado automáticamente
- Monitoreo de progreso opcional
- Retorna URL de descarga

### `storageService.uploadMultipleEvidencePhotos()`
- Sube múltiples fotos en paralelo
- Progress tracking consolidado
- Manejo de errores individual

### `storageService.getRepairEvidencePhotos()`
- Obtiene todas las fotos de una reparación
- Lista automática del folder estructurado

### `storageService.deleteEvidencePhoto()`
- Elimina foto individual por URL

### `storageService.deleteAllRepairEvidencePhotos()`
- Elimina todas las fotos de una reparación

## 🎨 UI Implementada

### Secciones Separadas
1. **Evidencias Guardadas**: Fotos ya subidas a Firebase
2. **Evidencias Pendientes**: Fotos locales por subir

### Estados Visuales
- ✅ Indicador de progreso durante upload
- ✅ Overlay con porcentaje en imágenes
- ✅ Botones contextuales (eliminar solo en modo edición)
- ✅ Labels descriptivos (Guardada/Pendiente)

### Interacciones
- 📸 Agregar desde cámara/galería
- 👀 Preview de imágenes
- 🗑️ Eliminar evidencias locales
- 💾 Guardar evidencias en Firebase
- 🔄 Loading automático al abrir pantalla

## 🔒 Seguridad

### Reglas de Firebase Storage Sugeridas
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Solo usuarios autenticados pueden acceder
    match /clients/{clientId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📋 Próximos Pasos

1. **Probar funcionalidad básica**:
   - Tomar foto con cámara
   - Seleccionar de galería
   - Guardar en Firebase
   - Cargar evidencias existentes

2. **Configurar reglas de seguridad** en Firebase Console

3. **Opcional - Mejoras**:
   - Compresión de imágenes antes de upload
   - Metadata adicional (tamaño, tipo, usuario)
   - Vista fullscreen para preview
   - Validación de tipos de archivo

## 🐛 Debugging

Si hay problemas:
1. Verificar que el plan Blaze esté activo en Firebase
2. Revisar reglas de Storage en Firebase Console  
3. Verificar permisos de cámara/galería en dispositivo
4. Comprobar conexión a internet para uploads

## 🔑 Variables Clave

- `clientId`: ID del cliente (repair.clientId)
- `customerId`: ID del customer (repair.customer.id)  
- `equipmentId`: ID del equipo (repair.equipment.id)
- `repairId`: ID de la reparación (repair.id)

Todas estas se obtienen automáticamente del objeto `repair` en RepairDetailScreen.
