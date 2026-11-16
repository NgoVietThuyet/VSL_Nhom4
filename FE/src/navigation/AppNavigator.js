import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import TopicsScreen from '../screens/TopicsScreen';
import TopicDetailScreen from '../screens/TopicDetailScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import SignDetailScreen from '../screens/SignDetailScreen';
import AICameraScreen from '../screens/AICameraScreen';
import QuizScreen from '../screens/QuizScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceContainerLowest,
          borderTopColor: COLORS.outlineVariant,
          borderTopWidth: StyleSheet.hairlineWidth,
          minHeight: 62,
          paddingTop: 6,
        },
        tabBarItemStyle: { minHeight: 48 },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.caption,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Topics"
        component={TopicsScreen}
        options={{
          tabBarLabel: 'Chủ đề',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="category" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AICameraTab"
        component={AICameraScreen}
        options={{
          tabBarLabel: 'Luyện AI',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-camera-front" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizScreen}
        options={{
          tabBarLabel: 'Quiz',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="psychology" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
        <Stack.Screen name="SignDetail" component={SignDetailScreen} />
        <Stack.Screen
          name="AICamera"
          component={AICameraScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="Quiz" component={QuizScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
