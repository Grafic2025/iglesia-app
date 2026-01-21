import { Text, View, Button, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState } from 'react'

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Necesitamos acceso a la cámara</Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : ({ data }) => {
          setScanned(true)
          alert(`QR leído:\n${data}`)
        }}
      />

      {scanned && (
        <View style={styles.button}>
          <Button title="Escanear de nuevo" onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
})
