import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer, DrawerActions, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { AuthProvider } from './src/auth/AuthProvider';
import { useAuth } from './src/auth/useAuth';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';
import Home from './src/screens/Home';
import MeditationScreen from './src/screens/MeditationScreen';
import Library from './src/screens/Library';
import { RootStackParamList } from './src/types/navigation';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';
import AnimatedBackground from './src/components/AnimatedBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from './src/config/stripe';

console.log('ROOT APP RENDERED');
// TODO: Move this to a config file
const API_BASE_URL = 'http://192.168.0.33:3000';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function TomoEssentials() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Tomo Essentials (Coming Soon)</Text>
    </View>
  );
}

function UpgradeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Upgrade (Coming Soon)</Text>
    </View>
  );
}

function LogoutScreen({ navigation }: any) {
  React.useEffect(() => {
    // Call your logout logic here
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation]);
  return null;
}

function CustomHeader({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeHeader}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLogo}>Tomo</Text>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Feather name="menu" size={32} color="#222" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function CustomDrawerContent(props: any) {
  const { state, navigation, descriptors } = props;
  return (
    <DrawerContentScrollView {...props}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const { drawerLabel, title, drawerIcon } = descriptors[route.key].options;
        const label = drawerLabel !== undefined ?
          typeof drawerLabel === 'function' ? drawerLabel({ focused, color: '#111', size: 18 }) : drawerLabel
          : title !== undefined ? title : route.name;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ marginHorizontal: 8, marginVertical: 4, borderRadius: 12, overflow: 'hidden' }}
          >
            {focused ? (
              <LinearGradient
                colors={["#EEEAAF", "#63B4D1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, borderRadius: 12 }}
              >
                <Text style={{ fontFamily: 'JosefinSans-Bold', fontSize: 18, color: '#111' }}>{label}</Text>
              </LinearGradient>
            ) : (
              <View style={{ padding: 16, borderRadius: 12 }}>
                <Text style={{ fontFamily: 'JosefinSans-Bold', fontSize: 18, color: '#111' }}>{label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </DrawerContentScrollView>
  );
}

function DrawerNav() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<{ isPremium: boolean } | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        if (!user) return;
        const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch subscription status');
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        header: () => <CustomHeader navigation={navigation} />,
        drawerPosition: 'right',
      })}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="My Library" component={Library} />
      <Drawer.Screen name="Tomo Essentials" component={TomoEssentials} />
      {!subscription?.isPremium && (
        <Drawer.Screen name="Upgrade" component={UpgradeScreen} />
      )}
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}

function Navigation() {
  const { user } = useAuth();
  return user ? (
    <DrawerNav />
  ) : (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} options={{ animation: 'none' }} />
      <Stack.Screen name="Signup" component={Signup} options={{ animation: 'none' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'JosefinSlab-Bold': require('./src/assets/fonts/JosefinSlab-Bold.ttf'),
    'JosefinSlab-Regular': require('./src/assets/fonts/JosefinSlab-Regular.ttf'),
    'JosefinSans-Bold': require('./src/assets/fonts/JosefinSans-Bold.ttf'),
    'JosefinSans-Regular': require('./src/assets/fonts/JosefinSans-Regular.ttf'),
  });

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <View style={{ flex: 1, position: 'relative' }}>
        <AnimatedBackground />
        <NavigationContainer theme={CustomTheme}>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </NavigationContainer>
      </View>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  safeHeader: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    // borderBottomWidth: 2,
    // borderBottomColor: '#888',
  },
  headerLogo: {
    fontFamily: 'JosefinSlab-Bold',
    fontSize: 40,
    color: '#111',
  },
});
