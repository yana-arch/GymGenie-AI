import { TimePeriod } from './AnalyticsService';

export interface PredictionPoint {
  date: string;
  value: number;
  confidenceIntervalUpper: number;
  confidenceIntervalLower: number;
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface PredictionResult {
  points: PredictionPoint[];
  confidence: ConfidenceLevel;
  confidenceScore: number;
  influenceFactors: { factor: string; impact: 'positive' | 'negative' }[];
  modelUsed: 'linear' | 'exponential';
}

export interface TargetEstimation {
  targetValue: number;
  estimatedDate: string;
  confidence: ConfidenceLevel;
  projections: {
    realistic: string;
    optimistic: string;
    conservative: string;
  };
}

export class PredictionService {
  private static instance: PredictionService;

  private constructor() {}

  public static getInstance(): PredictionService {
    if (!PredictionService.instance) {
      PredictionService.instance = new PredictionService();
    }
    return PredictionService.instance;
  }

  /**
   * Predict future performance based on historical trends
   */
  public predictFuturePerformance(
    data: { date: string; value: number }[],
    daysIntoFuture: number,
    model: 'linear' | 'exponential' | 'auto' = 'linear',
    isPlateau: boolean = false
  ): PredictionResult {
    if (data.length < 2) {
      return { 
        points: [], 
        confidence: 'Low', 
        confidenceScore: 0, 
        influenceFactors: [], 
        modelUsed: model === 'auto' ? 'linear' : model 
      };
    }

    // Auto model detection
    let selectedModel: 'linear' | 'exponential' = model === 'auto' ? 'linear' : model;
    if (model === 'auto') {
      const linearFit = this.calculateRSquared(data, 'linear');
      const exponentialFit = this.calculateRSquared(data, 'exponential');
      selectedModel = linearFit >= exponentialFit ? 'linear' : 'exponential';
    }

    const n = data.length;
    const startDate = new Date(data[0].date).getTime();
    
    // Convert dates to days from start to handle irregular intervals
    const x = data.map(d => (new Date(d.date).getTime() - startDate) / (24 * 60 * 60 * 1000));
    const y = selectedModel === 'exponential' 
      ? data.map(d => Math.log(Math.max(d.value, 0.001))) 
      : data.map(d => d.value);

    // Linear regression: y = a + bx
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }

    const denominator = (n * sumXX - sumX * sumX);
    let slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Dampen slope if plateau detected (AC 2.3)
    if (isPlateau && slope > 0) {
      slope *= 0.2; // Significant dampening for plateaus
    }

    // Calculate residuals and standard deviation for confidence intervals
    const residuals = y.map((val, i) => val - (intercept + slope * x[i]));
    const sumSqResiduals = residuals.reduce((acc, r) => acc + r * r, 0);
    const stdDev = Math.sqrt(sumSqResiduals / (n - 2 || 1));

    const lastDataPoint = data[data.length - 1];
    const lastDate = new Date(lastDataPoint.date);
    const lastX = (lastDate.getTime() - startDate) / (24 * 60 * 60 * 1000);
    const points: PredictionPoint[] = [];

    for (let i = 1; i <= daysIntoFuture; i++) {
      const nextX = lastX + i;
      const nextYRaw = intercept + slope * nextX;
      
      let value = selectedModel === 'exponential' ? Math.exp(nextYRaw) : nextYRaw;
      
      // Ensure no negative values (Physical Reality check)
      value = Math.max(0, value);
      
      // CI (95% approximate)
      const ciUpperRaw = nextYRaw + 1.96 * stdDev;
      const ciLowerRaw = nextYRaw - 1.96 * stdDev;
      
      points.push({
        date: new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value,
        confidenceIntervalUpper: Math.max(0, selectedModel === 'exponential' ? Math.exp(ciUpperRaw) : ciUpperRaw),
        confidenceIntervalLower: Math.max(0, selectedModel === 'exponential' ? Math.exp(ciLowerRaw) : ciLowerRaw)
      });
    }

    // Confidence level based on data volume and consistency
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentPoints = data.filter(d => new Date(d.date) >= thirtyDaysAgo).length;

    let confidence: ConfidenceLevel = 'Low';
    let confidenceScore = Math.min(n / 20, 0.5) + Math.min(recentPoints / 10, 0.5);
    
    if (recentPoints >= 10 && stdDev < (selectedModel === 'exponential' ? 0.2 : 5)) {
      confidence = 'High';
      confidenceScore = Math.min(0.95, confidenceScore + 0.2);
    } else if (recentPoints >= 5 || n >= 10) {
      confidence = 'Medium';
      confidenceScore = Math.min(0.7, confidenceScore + 0.1);
    }

    // Identify influence factors
    const influenceFactors: { factor: string; impact: 'positive' | 'negative' }[] = [];
    if (slope > 0) influenceFactors.push({ factor: 'Consistent Progress', impact: 'positive' });
    if (recentPoints > 5) influenceFactors.push({ factor: 'High Data Density', impact: 'positive' });
    if (isPlateau) influenceFactors.push({ factor: 'Recent Plateau', impact: 'negative' });
    if (stdDev > (selectedModel === 'exponential' ? 0.3 : 10)) influenceFactors.push({ factor: 'High Variance', impact: 'negative' });

    return { 
      points, 
      confidence, 
      confidenceScore, 
      influenceFactors, 
      modelUsed: selectedModel 
    };
  }

  /**
   * Calculate R-squared for model fit
   */
  private calculateRSquared(data: { date: string; value: number }[], model: 'linear' | 'exponential'): number {
    const n = data.length;
    const startDate = new Date(data[0].date).getTime();
    const x = data.map(d => (new Date(d.date).getTime() - startDate) / (24 * 60 * 60 * 1000));
    const y = model === 'exponential' 
      ? data.map(d => Math.log(Math.max(d.value, 0.001))) 
      : data.map(d => d.value);

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }

    const num = (n * sumXY - sumX * sumY);
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    if (den === 0) return 0;
    const r = num / den;
    return r * r;
  }

  /**
   * Estimate the date to reach a target value
   */
  public estimateDateForTarget(
    data: { date: string; value: number }[],
    targetValue: number,
    isPlateau: boolean = false
  ): TargetEstimation {
    if (data.length < 2) {
      return {
        targetValue,
        estimatedDate: '',
        confidence: 'Low',
        projections: { realistic: '', optimistic: '', conservative: '' }
      };
    }

    // Use linear model for estimation with current plateau status
    const predictionResult = this.predictFuturePerformance(data, 1, 'linear', isPlateau);
    const n = data.length;
    const startDate = new Date(data[0].date).getTime();
    const x = data.map(d => (new Date(d.date).getTime() - startDate) / (24 * 60 * 60 * 1000));
    const y = data.map(d => d.value);

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }

    const denominator = (n * sumXX - sumX * sumX);
    let slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    if (isPlateau && slope > 0) {
      slope *= 0.2;
    }

    const lastValue = data[data.length - 1].value;
    const lastDate = new Date(data[data.length - 1].date);
    const lastX = (lastDate.getTime() - startDate) / (24 * 60 * 60 * 1000);

    // Calculate residuals for SD based projections
    const residuals = y.map((val, i) => val - (intercept + slope * x[i]));
    const sumSqResiduals = residuals.reduce((acc, r) => acc + r * r, 0);
    const stdDev = Math.sqrt(sumSqResiduals / (n - 2 || 1));

    // If already reached or slope is <= 0 and target is higher
    if (lastValue >= targetValue || (slope <= 0 && targetValue > lastValue)) {
      return {
        targetValue,
        estimatedDate: 'Never',
        confidence: 'Low',
        projections: { realistic: 'Never', optimistic: 'Never', conservative: 'Never' }
      };
    }

    // targetValue = intercept + slope * x
    // x = (targetValue - intercept) / slope
    const targetX = (targetValue - intercept) / slope;
    const daysFromLast = targetX - lastX;

    // Projections based on confidence intervals and standard deviation
    // More statistically grounded than fixed multipliers
    const realisticDays = Math.ceil(daysFromLast);
    
    // Optimistic: assuming trend is at the upper bound of recent progress (+0.5 SD on slope)
    const optimisticSlope = slope + (stdDev / 30); // simplistic but better than 0.7x
    const optimisticDays = Math.ceil((targetValue - (intercept + optimisticSlope * lastX)) / optimisticSlope);
    
    // Conservative: assuming trend is at the lower bound or heavily dampened
    const conservativeDays = Math.ceil(daysFromLast * 2.0);

    const formatDate = (days: number) => {
      if (days === Infinity || isNaN(days) || days > 3650) return 'Never';
      return new Date(lastDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    };

    return {
      targetValue,
      estimatedDate: formatDate(realisticDays),
      confidence: predictionResult.confidence,
      projections: {
        realistic: formatDate(realisticDays),
        optimistic: formatDate(Math.max(1, optimisticDays)),
        conservative: formatDate(conservativeDays)
      }
    };
  }
}
