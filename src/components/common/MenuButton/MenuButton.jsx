import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export const MenuButton = ({ screen, title, color, icon, isLast = false }) => {
  const navigation = useNavigation();

  return <>
    <TouchableOpacity
        style={[styles.menuItem, !isLast && styles.menuItemDivider]}
        onPress={() => navigation.navigate(screen ? screen : 'Menu')}
    >
        <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
        <Image style={styles.menuIcon} source={icon} />
        </View>
        <Text style={styles.menuTitle}>{title}</Text>
        <Image style={styles.arrowIcon} source={require('../../../assets/Arrow-right.png')} />
    </TouchableOpacity>
  </>
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 45, 80, 0.08)',
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  menuTitle: {
    flex: 1,
    marginLeft: 12,
    color: '#052D50',
    fontSize: 16,
    fontWeight: '500',
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#698196',
  },
});
