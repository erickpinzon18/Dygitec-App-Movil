#!/bin/bash

echo "🚀 Configuración de Dygitec para Android e iOS"
echo "============================================="

# Verificar si Expo CLI está instalado
if ! command -v expo &> /dev/null; then
    echo "📱 Instalando Expo CLI..."
    npm install -g @expo/cli
fi

# Verificar dependencias
echo "📦 Verificando dependencias..."
npm install

# Verificar configuración
echo "⚙️  Verificando configuración..."

if [ ! -f "app.json" ]; then
    echo "❌ app.json no encontrado"
    exit 1
fi

if [ ! -f "config/firebase.ts" ]; then
    echo "❌ Configuración de Firebase no encontrada"
    exit 1
fi

echo "✅ Configuración verificada"

echo ""
echo "📱 Para ejecutar en dispositivos:"
echo "  Android: npm run android"
echo "  iOS:     npm run ios" 
echo "  Web:     npm run web"
echo ""
echo "📋 Antes de ejecutar:"
echo "  1. Configura Firebase en config/firebase.ts"
echo "  2. Para Android: Instala Android Studio"
echo "  3. Para iOS: Instala Xcode (solo macOS)"
echo ""
echo "🔥 Firebase Setup:"
echo "  1. Ve a https://console.firebase.google.com/"
echo "  2. Crea un nuevo proyecto"
echo "  3. Habilita Authentication (Email/Password)"
echo "  4. Crea una base de datos Firestore"
echo "  5. Reemplaza las credenciales en config/firebase.ts"
