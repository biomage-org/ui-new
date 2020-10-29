const getApiEndpoint = () => {
  try {
    const url = new URL(window.location.href);

    if (url.hostname.includes('staging')) {
      return url.origin.replace('ui', 'api');
    }

    if (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1')) {
      return 'http://localhost:3000';
    }

    return 'https://api.scp.biomage.net';
  } catch (error) {
    console.error('Failed to get API endpoint', window.location.href);
  }
};

export default getApiEndpoint;
