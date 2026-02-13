// Realistic mock data for clinical embryo analysis

import { Embryo, CohortData, DevelopmentStage, Frame, StageTransition, RiskFactor } from '../types';

// Helper to generate frame data
function generateFrames(
  count: number,
  durationHours: number,
  stages: StageTransition[]
): Frame[] {
  const frames: Frame[] = [];
  const hoursPerFrame = durationHours / count;

  for (let i = 0; i < count; i++) {
    const timeHours = i * hoursPerFrame;
    
    // Determine current stage based on time
    let currentStage: DevelopmentStage = 'tPB2';
    for (const transition of stages) {
      if (timeHours >= transition.timeHours) {
        currentStage = transition.stage;
      }
    }

    // Generate realistic confidence (higher in middle frames, lower at transitions)
    const nearTransition = stages.some(
      t => Math.abs(t.timeHours - timeHours) < 2
    );
    const baseConfidence = nearTransition ? 70 : 92;
    const confidence = baseConfidence + Math.random() * 8;

    // Morphological change (higher at transitions)
    const morphologicalChange = nearTransition 
      ? 0.6 + Math.random() * 0.3
      : 0.15 + Math.random() * 0.15;

    frames.push({
      index: i,
      timeHours: parseFloat(timeHours.toFixed(2)),
      imagePath: `frame_${i.toString().padStart(4, '0')}.png`,
      predictedStage: currentStage,
      confidence: parseFloat(confidence.toFixed(1)),
      morphologicalChange: parseFloat(morphologicalChange.toFixed(3)),
      anomalyFlag: nearTransition && Math.random() > 0.85 ? 'Stage transition' : undefined
    });
  }

  return frames;
}

// Generate realistic embryo data
function createEmbryo(
  id: string,
  params: {
    t2Time: number;
    t3Time: number;
    t5Time: number;
    blastocystTime?: number;
    developmentSpeed: 'Slow' | 'Normal' | 'Fast';
    viabilityScore: number;
  }
): Embryo {
  const durationHours = params.blastocystTime || params.t5Time + 24;
  const totalFrames = Math.floor(durationHours * 6); // 6 frames per hour

  const stageTransitions: StageTransition[] = [
    { stage: 'tPB2', timeHours: 1.2, isGroundTruth: true },
    { stage: 'tPNa', timeHours: 4.5, isGroundTruth: true },
    { stage: 'tPNf', timeHours: 18.3, isGroundTruth: true },
    { stage: 't2', timeHours: params.t2Time, isGroundTruth: true },
    { stage: 't3', timeHours: params.t3Time, isGroundTruth: true },
    { stage: 't4', timeHours: params.t3Time + 2.1, isGroundTruth: false },
    { stage: 't5', timeHours: params.t5Time, isGroundTruth: true },
    { stage: 't8', timeHours: params.t5Time + 6.2, isGroundTruth: false },
    { stage: 'tM', timeHours: params.t5Time + 18.5, isGroundTruth: false },
  ];

  if (params.blastocystTime) {
    stageTransitions.push(
      { stage: 'tSB', timeHours: params.blastocystTime - 8, isGroundTruth: false },
      { stage: 'tB', timeHours: params.blastocystTime, isGroundTruth: true },
      { stage: 'tEB', timeHours: params.blastocystTime + 6, isGroundTruth: false }
    );
  }

  const frames = generateFrames(totalFrames, durationHours, stageTransitions);

  // Generate risk factors based on development characteristics
  const riskFactors: RiskFactor[] = [];
  
  if (params.t2Time > 28) {
    riskFactors.push({
      name: 'Delayed 2-cell division',
      impact: -0.25,
      importance: 0.82
    });
  }
  
  if (params.t3Time - params.t2Time < 10) {
    riskFactors.push({
      name: 'Rapid t2→t3 transition',
      impact: -0.15,
      importance: 0.65
    });
  }

  if (params.developmentSpeed === 'Fast') {
    riskFactors.push({
      name: 'Accelerated development',
      impact: -0.12,
      importance: 0.58
    });
  }

  if (params.blastocystTime && params.blastocystTime < 100) {
    riskFactors.push({
      name: 'Optimal blastocyst timing',
      impact: 0.28,
      importance: 0.91
    });
  }

  const confidenceBase = params.blastocystTime ? 88 : 75;
  const confidenceVariance = (Math.random() - 0.5) * 10;

  const sensitivityInsights: string[] = [];
  if (params.t2Time > 27) {
    sensitivityInsights.push('Time to t2 is a critical predictor; reduction by 2h would increase score by ~0.08');
  }
  if (riskFactors.length > 2) {
    sensitivityInsights.push('Multiple minor risk factors present; primary sensitivity to blastocyst formation timing');
  }
  if (!params.blastocystTime) {
    sensitivityInsights.push('Blastocyst formation not yet observed; score is provisional');
  }

  return {
    id,
    totalFrames,
    observationDurationHours: parseFloat(durationHours.toFixed(1)),
    lastObservedStage: stageTransitions[stageTransitions.length - 1].stage,
    timeToT2: params.t2Time,
    timeToT3: params.t3Time,
    timeToT5: params.t5Time,
    blastocystFormation: !!params.blastocystTime,
    developmentSpeed: params.developmentSpeed,
    modelOutput: {
      viabilityScore: parseFloat(params.viabilityScore.toFixed(3)),
      confidence: parseFloat((confidenceBase + confidenceVariance).toFixed(1)),
      riskFactors,
      sensitivityInsights
    },
    frames,
    stageTransitions
  };
}

// Generate cohort with realistic variation
export const mockCohortData: CohortData = {
  cycleId: 'CYC-2026-02-12-A',
  embryos: [
    createEmbryo('EMB-001', {
      t2Time: 26.2,
      t3Time: 38.5,
      t5Time: 52.1,
      blastocystTime: 105.3,
      developmentSpeed: 'Normal',
      viabilityScore: 0.847
    }),
    createEmbryo('EMB-002', {
      t2Time: 28.7,
      t3Time: 40.1,
      t5Time: 54.8,
      blastocystTime: 112.6,
      developmentSpeed: 'Normal',
      viabilityScore: 0.782
    }),
    createEmbryo('EMB-003', {
      t2Time: 24.3,
      t3Time: 35.2,
      t5Time: 48.6,
      blastocystTime: 98.2,
      developmentSpeed: 'Fast',
      viabilityScore: 0.723
    }),
    createEmbryo('EMB-004', {
      t2Time: 31.5,
      t3Time: 44.8,
      t5Time: 58.3,
      developmentSpeed: 'Slow',
      viabilityScore: 0.612
    }),
    createEmbryo('EMB-005', {
      t2Time: 25.8,
      t3Time: 37.9,
      t5Time: 51.2,
      blastocystTime: 108.9,
      developmentSpeed: 'Normal',
      viabilityScore: 0.815
    }),
    createEmbryo('EMB-006', {
      t2Time: 29.4,
      t3Time: 42.3,
      t5Time: 56.7,
      blastocystTime: 115.2,
      developmentSpeed: 'Normal',
      viabilityScore: 0.758
    }),
    createEmbryo('EMB-007', {
      t2Time: 23.1,
      t3Time: 33.8,
      t5Time: 46.9,
      blastocystTime: 96.5,
      developmentSpeed: 'Fast',
      viabilityScore: 0.698
    }),
    createEmbryo('EMB-008', {
      t2Time: 32.8,
      t3Time: 46.2,
      t5Time: 61.5,
      developmentSpeed: 'Slow',
      viabilityScore: 0.584
    }),
    createEmbryo('EMB-009', {
      t2Time: 27.3,
      t3Time: 39.6,
      t5Time: 53.4,
      blastocystTime: 109.7,
      developmentSpeed: 'Normal',
      viabilityScore: 0.801
    }),
    createEmbryo('EMB-010', {
      t2Time: 26.9,
      t3Time: 38.8,
      t5Time: 52.6,
      blastocystTime: 106.8,
      developmentSpeed: 'Normal',
      viabilityScore: 0.834
    }),
    createEmbryo('EMB-011', {
      t2Time: 30.2,
      t3Time: 43.5,
      t5Time: 57.8,
      developmentSpeed: 'Slow',
      viabilityScore: 0.647
    }),
    createEmbryo('EMB-012', {
      t2Time: 25.1,
      t3Time: 36.7,
      t5Time: 50.3,
      blastocystTime: 102.4,
      developmentSpeed: 'Normal',
      viabilityScore: 0.822
    }),
  ]
};
