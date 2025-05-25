import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

// Extend Performance interface for Chrome's memory API
interface PerformanceMemory {
  usedJSMemory: number;
  totalJSMemory: number;
  jsMemoryLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface DebugInfo {
  platform: string;
  userAgent: string;
  isEmulator: boolean;
  memoryInfo?: any;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class DebugService {
  private platform = Capacitor.getPlatform();

  /**
   * 🔍 Get comprehensive debug information
   */
  getDebugInfo(): DebugInfo {
    const debugInfo: DebugInfo = {
      platform: this.platform,
      userAgent: navigator.userAgent,
      isEmulator: this.isAndroidEmulator(),
      timestamp: new Date(),
    };

    // Add memory information if available (Chrome specific)
    const extendedPerformance = performance as ExtendedPerformance;
    if (extendedPerformance.memory) {
      debugInfo.memoryInfo = {
        usedJSMemory: (extendedPerformance.memory.usedJSMemory / 1024 / 1024).toFixed(2) + ' MB',
        totalJSMemory: (extendedPerformance.memory.totalJSMemory / 1024 / 1024).toFixed(2) + ' MB',
        jsMemoryLimit: (extendedPerformance.memory.jsMemoryLimit / 1024 / 1024).toFixed(2) + ' MB',
      };
    }

    return debugInfo;
  }

  /**
   * 🔍 Detect if running in Android emulator
   */
  private isAndroidEmulator(): boolean {
    return (
      this.platform === 'android' &&
      (navigator.userAgent.includes('Emulator') ||
        navigator.userAgent.includes('Android SDK') ||
        window.location.hostname === 'localhost' ||
        navigator.userAgent.includes('unknown'))
    );
  }

  /**
   * 📊 Log memory usage and debug info
   */
  logMemoryUsage(context: string): void {
    const debugInfo = this.getDebugInfo();

    console.group(`🔍 Debug Info - ${context}`);
    console.log('Platform:', debugInfo.platform);
    console.log('Is Emulator:', debugInfo.isEmulator);

    if (debugInfo.memoryInfo) {
      console.log('Memory Usage:', debugInfo.memoryInfo);
    }

    console.log('User Agent:', debugInfo.userAgent);
    console.log('Timestamp:', debugInfo.timestamp.toISOString());
    console.groupEnd();
  }

  /**
   * 🚨 Log SQLite operation attempt
   */
  logSQLiteOperation(operation: string, recipeId?: string, userId?: string): void {
    const debugInfo = this.getDebugInfo();

    console.group(`🗄️ SQLite Operation - ${operation}`);
    console.log('Platform:', debugInfo.platform);
    console.log('Is Emulator:', debugInfo.isEmulator);

    if (recipeId) console.log('Recipe ID:', recipeId);
    if (userId) console.log('User ID:', userId);

    if (debugInfo.memoryInfo) {
      console.log('Memory before operation:', debugInfo.memoryInfo);
    }

    console.groupEnd();
  }

  /**
   * ⚠️ Determine if should use fallback based on platform and stability
   */
  shouldUseFallback(): boolean {
    const debugInfo = this.getDebugInfo();

    // MODIFICACIÓN: No usar fallback para emulador de Android
    // Mantenemos el log para depuración pero retornamos false
    if (debugInfo.isEmulator) {
      console.warn('🛡️ Using localStorage fallback due to Android emulator detected');
      // Retornamos false en lugar de true para usar SQLite en el emulador
      return false;
    }

    // Check memory pressure
    const extendedPerformance = performance as ExtendedPerformance;
    if (extendedPerformance.memory) {
      const memoryRatio = extendedPerformance.memory.usedJSMemory / extendedPerformance.memory.jsMemoryLimit;
      if (memoryRatio > 0.8) {
        console.warn('🛡️ Using localStorage fallback due to high memory usage');
        return true;
      }
    }

    return false;
  }
}
