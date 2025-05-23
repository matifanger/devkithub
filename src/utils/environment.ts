// Get packaging status from main process
const getBaseApi = async () => {
  try {
    const isPackaged = await window.electron.isPackaged();
    return isPackaged ? 'https://devkithub.com' : 'http://localhost:4000';
  } catch (error) {
    // Fallback to development mode if electron context is not available
    console.warn('Could not determine packaging status, defaulting to development mode');
    return 'http://localhost:4000';
  }
};

// For immediate use, we'll use a reasonable default and allow async override
export const baseApi = 'http://localhost:4000';

// Export async function for when we need the actual value
export const getBaseApiUrl = getBaseApi;
