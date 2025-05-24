import { Injectable, inject, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DebugService } from './debug.service';

interface MemoryState {
  isLowMemory: boolean;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  lastChecked: Date;
}

@Injectable({
  providedIn: 'root',
})
export class MemoryManagerService {
  private debugService = inject(DebugService);
  private ngZone = inject(NgZone);

  private platform = Capacitor.getPlatform();
  private memoryMonitorInterval: any;
  private readonly MEMORY_CHECK_INTERVAL = 5000; // 5 seconds
  private readonly CRITICAL_MEMORY_THRESHOLD = 0.9; // 90%
  private readonly HIGH_MEMORY_THRESHOLD = 0.8; // 80%
  private readonly MEDIUM_MEMORY_THRESHOLD = 0.6; // 60%

  private currentMemoryState: MemoryState = {
    isLowMemory: false,
    memoryPressure: 'low',
    lastChecked: new Date(),
  };

  /**
   * 🛡️ Start memory monitoring for Android crash prevention
   */
  startMemoryMonitoring(): void {
    if (this.platform !== 'android') {
      return; // Only monitor on Android
    }

    console.log('🧠 Starting memory monitoring for Android crash prevention');

    this.memoryMonitorInterval = setInterval(() => {
      this.ngZone.runOutsideAngular(() => {
        this.checkMemoryState();
      });
    }, this.MEMORY_CHECK_INTERVAL);

    // Initial check
    this.checkMemoryState();
  }

  /**
   * 🛑 Stop memory monitoring
   */
  stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
      console.log('🛑 Memory monitoring stopped');
    }
  }

  /**
   * 📊 Check current memory state
   */
  private checkMemoryState(): void {
    try {
      const extendedPerformance = performance as any;

      if (extendedPerformance.memory) {
        const { usedJSMemory, jsMemoryLimit } = extendedPerformance.memory;
        const memoryRatio = usedJSMemory / jsMemoryLimit;

        // Update memory state
        this.currentMemoryState = {
          isLowMemory: memoryRatio > this.HIGH_MEMORY_THRESHOLD,
          memoryPressure: this.calculateMemoryPressure(memoryRatio),
          lastChecked: new Date(),
        };

        // Log critical memory situations
        if (memoryRatio > this.CRITICAL_MEMORY_THRESHOLD) {
          console.warn(`🚨 CRITICAL MEMORY: ${(memoryRatio * 100).toFixed(1)}%`);
          this.triggerMemoryCleanup();
        } else if (memoryRatio > this.HIGH_MEMORY_THRESHOLD) {
          console.warn(`⚠️ HIGH MEMORY: ${(memoryRatio * 100).toFixed(1)}%`);
          this.suggestMemoryOptimization();
        }
      }
    } catch (error) {
      console.error('Error checking memory state:', error);
    }
  }

  /**
   * 🧮 Calculate memory pressure level
   */
  private calculateMemoryPressure(ratio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (ratio > this.CRITICAL_MEMORY_THRESHOLD) return 'critical';
    if (ratio > this.HIGH_MEMORY_THRESHOLD) return 'high';
    if (ratio > this.MEDIUM_MEMORY_THRESHOLD) return 'medium';
    return 'low';
  }

  /**
   * 🧹 Trigger emergency memory cleanup
   */
  private triggerMemoryCleanup(): void {
    try {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }

      // Clear any cached DOM elements
      this.clearDOMCache();

      // Suggest closing heavy components
      console.log('🧹 Emergency memory cleanup triggered');
    } catch (error) {
      console.error('Error during memory cleanup:', error);
    }
  }

  /**
   * 💡 Suggest memory optimization
   */
  private suggestMemoryOptimization(): void {
    console.log('💡 Consider optimizing memory usage:');
    console.log('  - Reduce form complexity');
    console.log('  - Clear large images');
    console.log('  - Limit dynamic arrays');
  }

  /**
   * 🗑️ Clear DOM cache and unused elements
   */
  private clearDOMCache(): void {
    try {
      // Remove any blob URLs that might be cached
      const blobURLs = document.querySelectorAll('img[src^="blob:"]');
      blobURLs.forEach((img) => {
        const src = (img as HTMLImageElement).src;
        if (src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      });

      // Clear any temporary canvas elements
      const canvases = document.querySelectorAll('canvas[data-temp="true"]');
      canvases.forEach((canvas) => canvas.remove());
    } catch (error) {
      console.error('Error clearing DOM cache:', error);
    }
  }

  /**
   * 🔍 Get current memory state
   */
  getMemoryState(): MemoryState {
    return { ...this.currentMemoryState };
  }

  /**
   * ⚠️ Check if memory is under pressure
   */
  isMemoryUnderPressure(): boolean {
    return this.currentMemoryState.memoryPressure === 'high' || this.currentMemoryState.memoryPressure === 'critical';
  }

  /**
   * 🚨 Check if we should prevent heavy operations
   */
  shouldPreventHeavyOperations(): boolean {
    return (
      this.currentMemoryState.memoryPressure === 'critical' ||
      (this.platform === 'android' && this.debugService.shouldUseFallback())
    );
  }

  /**
   * 📱 Get memory-optimized configuration for operations
   */
  getOptimizedConfig(): {
    imageQuality: number;
    maxImageSize: number;
    formLimits: {
      maxIngredients: number;
      maxInstructions: number;
    };
  } {
    const memoryPressure = this.currentMemoryState.memoryPressure;

    switch (memoryPressure) {
      case 'critical':
        return {
          imageQuality: 0.4,
          maxImageSize: 1 * 1024 * 1024, // 1MB
          formLimits: {
            maxIngredients: 10,
            maxInstructions: 8,
          },
        };
      case 'high':
        return {
          imageQuality: 0.6,
          maxImageSize: 2 * 1024 * 1024, // 2MB
          formLimits: {
            maxIngredients: 15,
            maxInstructions: 10,
          },
        };
      case 'medium':
        return {
          imageQuality: 0.7,
          maxImageSize: 3 * 1024 * 1024, // 3MB
          formLimits: {
            maxIngredients: 20,
            maxInstructions: 15,
          },
        };
      default:
        return {
          imageQuality: 0.8,
          maxImageSize: 5 * 1024 * 1024, // 5MB
          formLimits: {
            maxIngredients: 25,
            maxInstructions: 20,
          },
        };
    }
  }
}
