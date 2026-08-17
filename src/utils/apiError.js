// Extract a human-readable message from an axios/NestJS error. The backend
// sends either a string or an array of validation messages under
// response.data.message; fall back to the axios error message, then a caller
// supplied default. Single source of truth for the ~30 sites that used to
// inline this same chain.
export const getApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message || error?.message || fallback;
};

export default getApiErrorMessage;
