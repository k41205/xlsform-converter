// Check if the browser used is Chrome or Edge otherwise show a warning message and hide the app
const checkBrowserCompatibility = () => {
  const ua = navigator.userAgent;
  let browserName = '';
  let browserVersion = 0;

  if (/Chrome/.test(ua)) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) {
      browserVersion = parseInt(match[1], 10);
    }
  }

  if (/Edg/.test(ua)) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) {
      browserVersion = parseInt(match[1], 10);
    }
  }

  return (
    (browserName === 'Chrome' && browserVersion >= 86) ||
    (browserName === 'Edge' && browserVersion >= 86)
  );
};

export default checkBrowserCompatibility;
