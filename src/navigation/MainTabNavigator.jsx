import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MainScreen from '../screens/Main/MainScreen';
import ChatListScreen from '../screens/Main/Chat/ChatListScreen';
import ProjectsScreen from '../screens/Main/Project/ProjectsScreen';
import HistoryScreen from '../screens/Main/History/HistoryScreen';
import MenuScreen from '../screens/Menu/MenuScreen';
import { StyleSheet, Text, View, Image } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor: '#ffffff',
          borderRadius: 15,
          height: 90,
          ...styles.shadow
        }
      }}
    >
      <Tab.Screen 
        name="Main" 
        component={MainScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={focused ? require('../assets/Home.png') : require('../assets/HomeGray.png')} 
                resizeMode="contain"
                style={styles.tabIcon}
              />
              <Text style={{ color: focused ? '#000000' : '#748c94', fontSize: 12 }}>Главная</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={focused ? require('../assets/ChatBlur.png') : require('../assets/ChatBlur.png')} 
                resizeMode="contain"
                style={styles.tabIcon}
              />
              <Text style={{ color: focused ? '#000000' : '#748c94', fontSize: 12 }}>Чаты</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Projects" 
        component={ProjectsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={focused ? require('../assets/Projekts.png') : require('../assets/Projekts.png')} 
                resizeMode="contain"
                style={styles.tabIcon}
              />
              <Text style={{ color: focused ? '#000000' : '#748c94', fontSize: 12 }}>Проекты</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={focused ? require('../assets/Tasks.png') : require('../assets/Tasks.png')} 
                resizeMode="contain"
                style={styles.tabIcon}
              />
              <Text style={{ color: focused ? '#000000' : '#748c94', fontSize: 12 }}>История</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={focused ? require('../assets/Menu.png') : require('../assets/MenuGray.png')} 
                resizeMode="contain"
                style={styles.tabIcon}
              />
              <Text style={{ color: focused ? '#000000' : '#748c94', fontSize: 12 }}>Меню</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  shadow: {
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: 10,
  },
  tabIcon: {
    width: 25,
    height: 25,
  },
});