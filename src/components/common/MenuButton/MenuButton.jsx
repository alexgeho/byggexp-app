import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export const MenuButton = ({ id, screen, title, color, icon }) => {
  return <>
    <TouchableOpacity
        key={id}
        style={styles.menuItem}
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
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
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
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#698196',
  },
});
