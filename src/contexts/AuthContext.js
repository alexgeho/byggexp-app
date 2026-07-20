import React, { createContext, useState, useEffect } from 'react';
import { saveToken, saveUser, getUser, removeToken, removeUser, saveRefreshToken, removeRefreshToken } from '../utils/storage';
import {
  canManageEmployees as checkCanManageEmployees,
  canCreateProjects as checkCanCreateProjects,
  canManageProjects as checkCanManageProjects,
  canCreateTasks as checkCanCreateTasks,
  canManageTasks as checkCanManageTasks,
  canReopenTasks as checkCanReopenTasks,
  canCompleteTasks as checkCanCompleteTasks,
  canManageTools as checkCanManageTools,
  canManageWorkers as checkCanManageWorkers,
  canManageDocuments as checkCanManageDocuments,
} from '../utils/userRoles';
import { authService, userService, logUserActivity } from '../services';
import { jwtDecode } from 'jwt-decode';
import { unregisterPushToken } from '../services/notifications.service';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const loadTokenAndUser = async () => {
      const storedUser = await getUser();

      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        if (storedUser._id || storedUser.id) {
          setUserId(storedUser._id || storedUser.id);
        }
      }
      setIsLoading(false);
    };
    loadTokenAndUser();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await removeToken();
      await removeRefreshToken();
      await removeUser();
      setIsAuthenticated(false);
      setIsLoading(false);
      setUserId(null);
      setUser(null);
      setSelectedProject(null);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const updateStoredUser = async (userData) => {
    setUser(userData);
    await saveUser(userData);

    if (userData?._id || userData?.id) {
      setUserId(userData._id || userData.id);
    }
  };

  const fetchUserInfo = async (id) => {
    try {
      const userData = await userService.getInfo(id);
      await updateStoredUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('AuthContext: Ошибка при получении данных пользователя:', error);
      await removeToken();
      await removeUser();
      setIsAuthenticated(false);
    }
  };

  const applyAuthSession = async ({ access_token, refresh_token, user: userData }) => {
    await saveToken(access_token);
    if (refresh_token) {
      await saveRefreshToken(refresh_token);
    }
    await saveUser(userData);

    const decodedToken = jwtDecode(access_token);
    setUserId(decodedToken.sub);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const getApiErrorMessage = (error, fallback) => {
    const message = error?.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || error?.message || fallback;
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await authService.login(email, password);
      await applyAuthSession(data);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('AuthContext: Ошибка входа:', error);
      setIsLoading(false);
      return false;
    }
  };

  const magicLogin = async (code) => {
    try {
      setIsLoading(true);
      const data = await authService.magicLogin(code);
      await applyAuthSession(data);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('AuthContext: Magic login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const registerCompany = async ({ companyName, userName, email }) => {
    try {
      setIsLoading(true);
      const data = await authService.registerCompany({ companyName, userName, email });
      await applyAuthSession(data);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Ошибка регистрации:', error);
      setIsLoading(false);
      return {
        success: false,
        message: getApiErrorMessage(error, 'Registration failed'),
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    await logUserActivity({
      category: 'auth',
      type: 'logout_requested',
      level: 'info',
      message: 'User logged out from the mobile app.',
      details: {
        userId,
      },
    }).catch((error) => {
      console.error('AuthContext: Failed to log logout activity:', error);
    });
    await unregisterPushToken().catch((error) => {
      console.error('AuthContext: Failed to unregister push token:', error);
    });
    await removeToken();
    await removeRefreshToken();
    await removeUser();
    setIsAuthenticated(false);
    setUserId(null);
    setUser(null);
    setSelectedProject(null);
  };

  // Хелперы для проверки ролей (синхронизированы с бэкенд @Roles)
  const isWorker = () => user?.role === 'worker';
  const isSuperAdmin = () => user?.role === 'superadmin';
  const isProjectAdmin = () => user?.role === 'projectAdmin';
  const isCompanyAdmin = () => user?.role === 'companyAdmin';
  const canCreateProjects = () => checkCanCreateProjects(user?.role);
  const canManageProjects = () => checkCanManageProjects(user?.role);
  const canCreateTasks = () => checkCanCreateTasks(user?.role);
  const canManageTasks = () => checkCanManageTasks(user?.role);
  const canReopenTasks = () => checkCanReopenTasks(user?.role);
  const canCompleteTasks = () => checkCanCompleteTasks(user?.role);
  const canManageTools = () => checkCanManageTools(user?.role);
  const canManageWorkers = () => checkCanManageWorkers(user?.role);
  const canManageEmployees = () => checkCanManageEmployees(user?.role);
  const canManageDocuments = () => checkCanManageDocuments(user?.role);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login,
      magicLogin,
      registerCompany,
      logout, 
      userId, 
      user,
      selectedProject,
      setSelectedProject,
      setIsAuthenticated,
      updateStoredUser,
      fetchUserInfo,
      isWorker,
      isSuperAdmin,
      isProjectAdmin,
      isCompanyAdmin,
      canCreateProjects,
      canManageProjects,
      canCreateTasks,
      canManageTasks,
      canReopenTasks,
      canCompleteTasks,
      canManageTools,
      canManageWorkers,
      canManageEmployees,
      canManageDocuments,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

