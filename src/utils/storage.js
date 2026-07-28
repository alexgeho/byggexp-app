import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem('jwtToken', token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    return token;
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('jwtToken');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};

export const saveRefreshToken = async (token) => {
  try {
    await AsyncStorage.setItem('refreshToken', token);
  } catch (error) {
    console.error('Failed to save refresh token:', error);
  }
};

export const getRefreshToken = async () => {
  try {
    const token = await AsyncStorage.getItem('refreshToken');
    return token;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

export const removeRefreshToken = async () => {
  try {
    await AsyncStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Failed to remove refresh token:', error);
  }
};

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
  }
};

export const getUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Failed to remove user:', error);
  }
};

export const saveSelectedProject = async (project) => {
  try {
    await AsyncStorage.setItem('selectedProject', JSON.stringify(project));
  } catch (error) {
    console.error('Failed to save selected project:', error);
  }
};

export const getSelectedProject = async () => {
  try {
    const projectStr = await AsyncStorage.getItem('selectedProject');
    return projectStr ? JSON.parse(projectStr) : null;
  } catch (error) {
    console.error('Failed to get selected project:', error);
    return null;
  }
};

export const removeSelectedProject = async () => {
  try {
    await AsyncStorage.removeItem('selectedProject');
  } catch (error) {
    console.error('Failed to remove selected project:', error);
  }
};
