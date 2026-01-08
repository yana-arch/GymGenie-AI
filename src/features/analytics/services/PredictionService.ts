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
    model: 'linear' | 'exponential' = 'linear',
    isPlateau: boolean = false
  ): PredictionResult {
    if (data.length < 2) {
      return { points: [], confidence: 'Low', modelUsed: model };
    }

    const n = data.length;
    const startDate = new Date(data[0].date).getTime();
    
    // Convert dates to days from start to handle irregular intervals
    const x = data.map(d => (new Date(d.date).getTime() - startDate) / (24 * 60 * 60 * 1000));
    const y = model === 'exponential' 
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
      
      let value = model === 'exponential' ? Math.exp(nextYRaw) : nextYRaw;
      
      // Ensure no negative values (Physical Reality check)
      value = Math.max(0, value);
      
      // CI (95% approximate)
      const ciUpperRaw = nextYRaw + 1.96 * stdDev;
      const ciLowerRaw = nextYRaw - 1.96 * stdDev;
      
      points.push({
        date: new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value,
        confidenceIntervalUpper: Math.max(0, model === 'exponential' ? Math.exp(ciUpperRaw) : ciUpperRaw),
        confidenceIntervalLower: Math.max(0, model === 'exponential' ? Math.exp(ciLowerRaw) : ciLowerRaw)
      });
    }

    // Confidence level based on data volume and consistency
    // AC 1.3: "High Confidence" if 10+ data points in last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentPoints = data.filter(d => new Date(d.date) >= thirtyDaysAgo).length;

    let confidence: ConfidenceLevel = 'Low';
    if (recentPoints >= 10 && stdDev < (model === 'exponential' ? 0.2 : 5)) {
      confidence = 'High';
    } else if (recentPoints >= 5 || n >= 10) {
      confidence = 'Medium';
    }

    return { points, confidence, modelUsed: model };
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
