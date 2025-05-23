// Get packaging status from main process
const getBaseApi = async () => {
  try {
    const isPackaged = process.env.NODE_ENV === 'production';
    console.log('isPackaged', isPackaged);
    return isPackaged ? 'https://devkithub.com' : 'http://localhost:4000';
  } catch (error) {
    // Fallback to production mode if electron context is not available
    console.warn('Could not determine packaging status, defaulting to production');
    console.warn(error);
    return 'https://devkithub.com';
  }
};

// Export async function for when we need the actual value
export const getBaseApiUrl = getBaseApi;
