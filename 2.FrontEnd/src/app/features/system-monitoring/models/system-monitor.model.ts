export interface DiskInfo {
  name: string;
  driveType: string;
  totalSizeBytes: number;
  freeSizeBytes: number;
  usedSizeBytes: number;
  usagePercent: number;
}

export interface ServiceHealth {
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message?: string;
  responseTimeMs: number;
}

export interface NetworkStats {
  totalBytesReceived: number;
  totalBytesSent: number;
  bytesReceivedPerSec: number;
  bytesSentPerSec: number;
}

export interface HttpStats {
  activeRequests: number;
  totalRequests: number;
  requestsPerSecond: number;
  avgResponseTimeMs: number;
}

export interface HangfireStats {
  enqueued: number;
  processing: number;
  succeeded: number;
  failed: number;
  scheduled: number;
  recurring: number;
  servers: number;
}

export interface SystemMonitorSnapshot {
  timestamp: string;

  // CPU
  cpuUsagePercent: number;
  processorCount: number;

  // Memory
  totalMemoryBytes: number;
  usedMemoryBytes: number;
  freeMemoryBytes: number;
  memoryUsagePercent: number;

  // Disk
  disks: DiskInfo[];

  // Process / Thread
  threadCount: number;
  processMemoryBytes: number;
  processId: number;
  processStartTime: string;

  // GC Stats
  gcHeapSizeBytes: number;
  gen0Collections: number;
  gen1Collections: number;
  gen2Collections: number;

  // Server Info
  serverName: string;
  osDescription: string;
  frameworkDescription: string;
  uptimeDisplay: string;
  uptimeTotalSeconds: number;
  environmentName: string;

  // Network I/O
  network?: NetworkStats;

  // HTTP Metrics
  httpStats?: HttpStats;

  // Hangfire
  hangfireStats?: HangfireStats;

  // App / SignalR
  onlineUsers: number;
  activeConnections: number;
  onlineUsernames: string[];

  // External services
  services: ServiceHealth[];
}
