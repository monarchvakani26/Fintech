// ============================================================
// Rakshak AI - Device Fingerprinting
// Collects browser/device signals and generates unique hash
// ============================================================

/**
 * Generate a canvas fingerprint
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 240;
    canvas.height = 60;
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#722f37';
    ctx.fillRect(0, 0, 240, 60);
    ctx.fillStyle = '#EFDFBB';
    ctx.fillText('Rakshak AI Sovereign 🛡️', 2, 15);
    ctx.fillStyle = 'rgba(114, 47, 55, 0.7)';
    ctx.fillText('Financial Security Layer', 4, 35);
    return canvas.toDataURL().slice(-100);
  } catch {
    return 'canvas-not-available';
  }
}

/**
 * Get WebGL fingerprint
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'webgl-unavailable';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      return `${vendor}~${renderer}`;
    }
    return 'webgl-no-debug';
  } catch {
    return 'webgl-error';
  }
}

/**
 * Collect all device signals
 */
export function collectDeviceSignals() {
  const nav = navigator;
  const screen = window.screen;

  return {
    userAgent: nav.userAgent,
    language: nav.language,
    languages: nav.languages?.join(',') || '',
    platform: nav.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    timezoneOffset: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || 'unknown',
    connectionType: nav.connection?.effectiveType || 'unknown',
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    canvasFingerprint: getCanvasFingerprint(),
    webglFingerprint: getWebGLFingerprint(),
    screenOrientation: screen.orientation?.type || 'unknown',
  };
}

/**
 * Simple hash function for combining signals
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate device fingerprint hash
 */
export function generateDeviceFingerprint() {
  const signals = collectDeviceSignals();
  const combined = [
    signals.userAgent,
    signals.screenResolution,
    signals.colorDepth,
    signals.timezone,
    signals.platform,
    signals.hardwareConcurrency,
    signals.deviceMemory,
    signals.canvasFingerprint,
    signals.webglFingerprint,
    signals.language,
  ].join('|');

  return simpleHash(combined) + simpleHash(combined.split('').reverse().join(''));
}

/**
 * Get simplified device info for display
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let platform = 'Desktop';
  let browser = 'Unknown Browser';

  if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS';
  else if (/Android/i.test(ua)) platform = 'Android';
  else if (/Mac/i.test(ua)) platform = 'macOS';
  else if (/Win/i.test(ua)) platform = 'Windows';
  else if (/Linux/i.test(ua)) platform = 'Linux';

  if (/Chrome/i.test(ua) && !/Chromium|Edge/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge/i.test(ua)) browser = 'Edge';

  return { platform, browser, resolution: `${window.screen.width}x${window.screen.height}` };
}
