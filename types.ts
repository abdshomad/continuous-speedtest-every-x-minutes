
export interface SpeedResult {
  timestamp: number;
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
}

export interface NetworkInsight {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  recommendations: string[];
}
