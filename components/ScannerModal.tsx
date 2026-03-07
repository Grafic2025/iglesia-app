import { FontAwesome } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScannerModalProps {
  onClose: () => void;
  onBarCodeScanned: (data: any) => Promise<void>;
}

const ScannerModal: React.FC<ScannerModalProps> = ({
  onClose,
  onBarCodeScanned,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        {/* ============ CAMERA VIEW ============ */}
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={onBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* ============ SAFE AREA CONTENT ============ */}
        <View
          style={[
            { flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          {/* Header */}
          <View style={{ padding: 25 }}>
            <TouchableOpacity
              style={styles.camCloseBtn}
              onPress={onClose}
            >
              <FontAwesome name="arrow-left" size={18} color="#c5ff00" />
              <Text style={styles.camCloseLabel}>VOLVER / CERRAR</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Guide */}
          <View style={styles.camGuideContainer}>
            <View style={styles.camGuideFrame} />
            <View style={styles.camInstructionBox}>
              <Text style={styles.camInstructionText}>
                Centra el código QR para marcar presente
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScannerModal;

// ======================================
// STYLES
// ======================================
const styles = StyleSheet.create({
  // Close Button
  camCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(197,255,0,0.4)',
    shadowColor: '#c5ff00',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  camCloseLabel: {
    color: '#fff',
    marginLeft: 15,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },

  // Guide Container
  camGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  camGuideFrame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: '#c5ff00',
    borderRadius: 40,
    backgroundColor: 'transparent',
    shadowColor: '#c5ff00',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  // Instruction Box
  camInstructionBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#222',
  },

  camInstructionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
});