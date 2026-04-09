import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GlassView } from './common/GlassView/GlassView';

const DEFAULT_LEFT_ICON = require('../assets/HomeGray.png');
const DEFAULT_RIGHT_ICON = require('../assets/MenuGray.png');
const DEFAULT_ADD_ICON = require('../assets/Plus.png');

export const BottomBar = ({
  onLeftPress,
  onRightPress,
  onAddPress,
  leftIcon = DEFAULT_LEFT_ICON,
  rightIcon = DEFAULT_RIGHT_ICON,
  addIcon = DEFAULT_ADD_ICON,
  showAddButton = true,
  renderAddContent,
}) => {
  return (
    <View style={styles.bottomBar}>
      <GlassView
        style={styles.navButtons}
        backgroundColor='rgba(238, 245, 251, 0.5)'
        borderColor='rgba(238, 245, 251, 0.5)'
        intensity={60}
        tint="light"
      >
        <TouchableOpacity onPress={onLeftPress} style={styles.navButton}>
          <Image style={styles.navIcon} source={leftIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRightPress} style={styles.navButton}>
          <Image style={styles.navIcon} source={rightIcon} />
        </TouchableOpacity>
      </GlassView>
      {showAddButton && (
        <TouchableOpacity onPress={onAddPress} style={styles.addProjectButton}>
          {renderAddContent ? renderAddContent() : (
            <Image style={styles.addIcon} source={addIcon} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    width: '100%',
    padding: 20,
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  navButtons: {
    flexDirection: 'row',
    backgroundColor: '#EEF5FB',
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 24,
    shadowColor: '#999',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  navButton: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  addProjectButton: {
    width: 80,
    height: 80,
    backgroundColor: '#0091FF',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#999',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.325,
    shadowRadius: 10,
    elevation: 2,
  },
  addIcon: {
    width: 24,
    height: 24,
  },
});
