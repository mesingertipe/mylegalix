import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export const scanInvoice = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Se necesita permiso para la cámara');
    return null;
  }

  let result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0];
  }
  return null;
};
