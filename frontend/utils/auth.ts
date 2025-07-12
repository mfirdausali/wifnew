import Cookies from 'js-cookie';

export function clearAllAuthCookies() {
  // List of all possible auth cookie names
  const authCookies = ['accessToken', 'refreshToken', 'refresh-token', 'access-token'];
  
  // Clear using js-cookie for all possible paths and domains
  authCookies.forEach(cookieName => {
    // Clear default
    Cookies.remove(cookieName);
    
    // Clear with specific paths
    Cookies.remove(cookieName, { path: '/' });
    Cookies.remove(cookieName, { path: '/', domain: 'localhost' });
    Cookies.remove(cookieName, { path: '/', domain: '.localhost' });
    
    // Clear using document.cookie for all possible combinations
    const domains = ['', 'localhost', '.localhost', window.location.hostname];
    const paths = ['/', '', '/api', '/login'];
    
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
      });
    });
  });
  
  console.log('[Auth] All auth cookies cleared');
}

export function debugCookies() {
  console.log('[Auth] Current cookies:');
  const allCookies = document.cookie.split(';');
  allCookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && (name.includes('Token') || name.includes('token'))) {
      console.log(`  ${name}: ${value?.substring(0, 50)}...`);
    }
  });
  
  // Also check js-cookie
  console.log('[Auth] js-cookie values:');
  console.log('  accessToken:', Cookies.get('accessToken')?.substring(0, 50));
  console.log('  refreshToken:', Cookies.get('refreshToken')?.substring(0, 50));
}