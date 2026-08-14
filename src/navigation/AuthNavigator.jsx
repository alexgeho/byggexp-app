import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import RegisterVerifyScreen from "../screens/Auth/RegisterVerifyScreen";
import CodeLoginScreen from "../screens/Auth/CodeLoginScreen";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterVerify" component={RegisterVerifyScreen} />
      <Stack.Screen name="CodeLogin" component={CodeLoginScreen} />
    </Stack.Navigator>
  );
}
