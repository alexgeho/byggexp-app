import api from './api';

export const logUserActivity = async ({
  category,
  type,
  level = 'info',
  message,
  source = 'mobile-app',
  details = {},
}) => {
  if (!category || !type || !message) {
    return;
  }

  await api.post('/users/activity-log', {
    category,
    type,
    level,
    message,
    source,
    details,
  });
};

export default {
  logUserActivity,
};
