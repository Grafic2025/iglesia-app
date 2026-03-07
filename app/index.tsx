import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#c5ff00" />
        </View>
    );
}
