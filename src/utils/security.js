// frontend/src/utils/security.js
// FRONTEND SECURITY - ANTI-DEBUGGING & API PROTECTION

import crypto from "crypto-js";

// ═══════════════════════════════════════════════════════════
// CONSOLE PROTECTION (Disable in Production)
// ═══════════════════════════════════════════════════════════

export class ConsoleProtection {
  static init() {
    if (process.env.NODE_ENV === "production") {
      // Disable console methods
      const noop = () => {};

      Object.keys(console).forEach((method) => {
        console[method] = noop;
      });

      // Override console object entirely
      window.console = new Proxy(console, {
        get(target, prop) {
          return noop;
        },
      });

      console.log("[Security] Console protection enabled"); // This won't show
    }
  }

  // Detect DevTools
  static detectDevTools() {
    const threshold = 160;

    setInterval(() => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        // DevTools detected - you can redirect or show warning
        console.warn("[Security] Developer tools detected");

        // Optional: Redirect to warning page
        // window.location.href = '/devtools-warning';

        // Optional: Clear sensitive data
        // this.clearSensitiveData();
      }
    }, 1000);
  }

  // Clear sensitive data from memory
  static clearSensitiveData() {
    sessionStorage.clear();

    // Clear specific items only if needed
    const keysToKeep = ["theme", "language"];
    const allKeys = Object.keys(localStorage);

    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Disable right-click (optional - not recommended for UX)
  static disableRightClick() {
    if (process.env.NODE_ENV === "production") {
      document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
      });
    }
  }

  // Disable keyboard shortcuts for DevTools
  static disableDevToolsShortcuts() {
    if (process.env.NODE_ENV === "production") {
      document.addEventListener("keydown", (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          e.key === "F12" ||
          (e.ctrlKey &&
            e.shiftKey &&
            (e.key === "I" || e.key === "J" || e.key === "C")) ||
          (e.ctrlKey && e.key === "U")
        ) {
          e.preventDefault();
          return false;
        }
      });
    }
  }

  // Debugger detection
  static antiDebug() {
    setInterval(() => {
      const before = Date.now();
      debugger; // This will pause if debugger is open
      const after = Date.now();

      if (after - before > 100) {
        console.log("[Security] Debugger detected");
        // Optional: Take action
        // window.location.href = '/';
      }
    }, 1000);
  }
}

// ═══════════════════════════════════════════════════════════
// API REQUEST ENCRYPTION
// ═══════════════════════════════════════════════════════════

const API_SECRET = process.env.REACT_APP_API_SECRET || "your-secret-key";

export class SecureAPI {
  // Generate HMAC signature
  static generateSignature(data, timestamp) {
    const payload = JSON.stringify(data) + timestamp;
    return crypto.HmacSHA256(payload, API_SECRET).toString();
  }

  // Encrypt request payload
  static encryptPayload(data) {
    const encrypted = crypto.AES.encrypt(
      JSON.stringify(data),
      API_SECRET,
    ).toString();

    return encrypted;
  }

  // Decrypt response payload
  static decryptPayload(encrypted) {
    try {
      const decrypted = crypto.AES.decrypt(encrypted, API_SECRET);
      return JSON.parse(decrypted.toString(crypto.enc.Utf8));
    } catch (error) {
      console.error("[Security] Decryption failed");
      return null;
    }
  }

  // Create secure request headers
  static createSecureHeaders(data) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(data, timestamp);

    return {
      "Content-Type": "application/json",
      "X-Signature": signature,
      "X-Timestamp": timestamp,
      "X-Client-ID": this.getClientFingerprint(),
    };
  }

  // Generate browser fingerprint (basic)
  static getClientFingerprint() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join("|");

    return crypto.SHA256(fingerprint).toString();
  }
}

// ═══════════════════════════════════════════════════════════
// SENSITIVE DATA ENCRYPTION (LocalStorage)
// ═══════════════════════════════════════════════════════════

export class SecureStorage {
  static ENCRYPTION_KEY =
    process.env.REACT_APP_STORAGE_KEY || "default-key-change-this";

  // Encrypt and store
  static setItem(key, value) {
    try {
      const encrypted = crypto.AES.encrypt(
        JSON.stringify(value),
        this.ENCRYPTION_KEY,
      ).toString();

      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error("[SecureStorage] Encryption failed:", error);
    }
  }

  // Decrypt and retrieve
  static getItem(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = crypto.AES.decrypt(encrypted, this.ENCRYPTION_KEY);
      return JSON.parse(decrypted.toString(crypto.enc.Utf8));
    } catch (error) {
      console.error("[SecureStorage] Decryption failed:", error);
      return null;
    }
  }

  // Remove item
  static removeItem(key) {
    localStorage.removeItem(key);
  }

  // Clear all
  static clear() {
    localStorage.clear();
  }
}

// ═══════════════════════════════════════════════════════════
// ANTI-TAMPERING
// ═══════════════════════════════════════════════════════════

export class IntegrityCheck {
  static checksums = new Map();

  // Store checksum of critical code
  static registerFunction(name, func) {
    const checksum = crypto.SHA256(func.toString()).toString();
    this.checksums.set(name, checksum);
  }

  // Verify function hasn't been tampered
  static verify(name, func) {
    const original = this.checksums.get(name);
    const current = crypto.SHA256(func.toString()).toString();

    return original === current;
  }
}

// ═══════════════════════════════════════════════════════════
// OBFUSCATE API ENDPOINTS (Make them less obvious)
// ═══════════════════════════════════════════════════════════

export class EndpointObfuscator {
  static endpoints = {
    // Encode actual endpoints
    login: crypto.enc.Base64.stringify(
      crypto.enc.Utf8.parse("/api/auth/login"),
    ),
    register: crypto.enc.Base64.stringify(
      crypto.enc.Utf8.parse("/api/auth/register"),
    ),
    verify: crypto.enc.Base64.stringify(
      crypto.enc.Utf8.parse("/api/auth/verify"),
    ),
  };

  static getEndpoint(name) {
    const encoded = this.endpoints[name];
    if (!encoded) return null;

    return crypto.enc.Utf8.stringify(crypto.enc.Base64.parse(encoded));
  }
}

// ═══════════════════════════════════════════════════════════
// NETWORK REQUEST OBFUSCATION
// ═══════════════════════════════════════════════════════════

export class NetworkObfuscator {
  // Add random delay to requests (makes timing attacks harder)
  static async addJitter(min = 50, max = 200) {
    const delay = Math.random() * (max - min) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Add dummy requests to confuse traffic analysis
  static async sendDummyRequests() {
    if (Math.random() > 0.7) {
      // 30% chance
      // Send harmless dummy request
      fetch("/api/health", { method: "GET" }).catch(() => {});
    }
  }
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

export function initSecurity() {
  if (process.env.NODE_ENV === "production") {
    ConsoleProtection.init();
    ConsoleProtection.detectDevTools();
    ConsoleProtection.disableDevToolsShortcuts();

    // Optional - uncomment if needed
    // ConsoleProtection.disableRightClick();
    // ConsoleProtection.antiDebug();
  }

  console.log("[Security] Protection layers activated");
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  ConsoleProtection,
  SecureAPI,
  SecureStorage,
  IntegrityCheck,
  EndpointObfuscator,
  NetworkObfuscator,
  initSecurity,
};
