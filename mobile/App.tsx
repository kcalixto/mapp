import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// TODO: definir a URL do site que o app vai exibir
const WEB_URL = 'http://mapp-hub-ui-sa-east-1.s3-website-sa-east-1.amazonaws.com/';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);

  useEffect(() => {
    // Botão voltar do Android navega o histórico da webview antes de sair do app
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBackRef.current) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        onNavigationStateChange={state => {
          canGoBackRef.current = state.canGoBack;
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
});

export default App;
