import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Camera, CreditCard, Scan, History, Settings, Bell, Lock } from 'lucide-react-native';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balance, setBalance] = useState(1250000);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return setIsAuthenticated(true);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autenticación requerida para ver saldo',
      fallbackLabel: 'Usar contraseña',
    });

    if (result.success) setIsAuthenticated(true);
  };

  useEffect(() => {
    handleBiometricAuth();
  }, []);

  if (!isAuthenticated) {
    return (
      <View style={styles.lockedContainer}>
        <Lock size={48} color="#6366f1" />
        <Text style={styles.lockedText}>Legalix está bloqueado</Text>
        <TouchableOpacity style={styles.authButton} onPress={handleBiometricAuth}>
          <Text style={styles.authButtonText}>Desbloquear con FaceID</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hola, Carlos</Text>
            <Text style={styles.companyText}>Logística Express</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Glassmorphism Card */}
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardBrand}>LEGALIX</Text>
            <CreditCard size={32} color="white" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>CUPÓ DISPONIBLE</Text>
            <Text style={styles.balance}>$ {balance.toLocaleString()}</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardNumber}>**** **** **** 4521</Text>
            <Text style={styles.cardExpiry}>05/28</Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#6366f120' }]}>
              <Scan size={24} color="#6366f1" />
            </View>
            <Text style={styles.actionLabel}>Escanear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#10b98120' }]}>
              <History size={24} color="#10b981" />
            </View>
            <Text style={styles.actionLabel}>Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
              <Settings size={24} color="#f59e0b" />
            </View>
            <Text style={styles.actionLabel}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.transactionItem}>
            <View style={styles.merchantCircle}><Text style={{color:'white'}}>CW</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.merchantName}>Crepes & Waffles</Text>
              <Text style={styles.transactionDate}>Hoy, 1:30 PM</Text>
            </View>
            <Text style={styles.transactionAmount}>-$54.000</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  welcomeText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  companyText: { color: '#94a3b8', fontSize: 14 },
  card: {
    height: 220,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'space-between',
    overflow: 'hidden'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 },
  balance: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: 'white', fontSize: 16, letterSpacing: 1 },
  cardExpiry: { color: 'white', fontSize: 14 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 30 },
  actionItem: { alignItems: 'center' },
  actionIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { color: 'white', fontSize: 12 },
  recentSection: { marginTop: 10 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  merchantCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  merchantName: { color: 'white', fontWeight: '600' },
  transactionDate: { color: '#94a3b8', fontSize: 12 },
  transactionAmount: { color: 'white', fontWeight: 'bold' },
  lockedContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  lockedText: { color: 'white', marginTop: 20, fontSize: 18 },
  authButton: { marginTop: 30, backgroundColor: '#6366f1', padding: 15, borderRadius: 12 },
  authButtonText: { color: 'white', fontWeight: 'bold' }
});
