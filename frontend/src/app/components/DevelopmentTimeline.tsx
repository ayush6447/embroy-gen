import { Embryo } from "../types";
import { useMemo } from "react";

interface DevelopmentTimelineProps {
  embryo: Embryo;
  currentFrameIndex: number;
  onFrameChange: (index: number) => void;
}

const STAGE_COLORS: Record<string, string> = {
  'tPB2': '#94a3b8',  // slate
  'tPNa': '#60a5fa',  // blue
  'tPNf': '#38bdf8',  // sky
  't2': '#22d3ee',    // cyan
  't3': '#2dd4bf',    // teal
  't4': '#34d399',    // emerald
  't5': '#4ade80',    // green
  't8': '#a3e635',    // lime
  'tM': '#facc15',    // yellow
  'tSB': '#fb923c',   // orange
  'tB': '#f97316',    // orange-600
  'tEB': '#dc2626',   // red
};

export function DevelopmentTimeline({ embryo, currentFrameIndex, onFrameChange }: DevelopmentTimelineProps) {
  const currentFrame = embryo.frames[currentFrameIndex];
  
  // Create timeline segments
  const timelineSegments = useMemo(() => {
    const segments: Array<{
      stage: string;
      startTime: number;
      endTime: number;
      startPercent: number;
      widthPercent: number;
      isGroundTruth: boolean;
    }> = [];

    const maxTime = embryo.observationDurationHours;

    for (let i = 0; i < embryo.stageTransitions.length; i++) {
      const current = embryo.stageTransitions[i];
      const next = embryo.stageTransitions[i + 1];
      
      const startTime = current.timeHours;
      const endTime = next ? next.timeHours : maxTime;
      
      segments.push({
        stage: current.stage,
        startTime,
        endTime,
        startPercent: (startTime / maxTime) * 100,
        widthPercent: ((endTime - startTime) / maxTime) * 100,
        isGroundTruth: current.isGroundTruth
      });
    }

    return segments;
  }, [embryo]);

  // Current position percentage
  const currentPercent = (currentFrame.timeHours / embryo.observationDurationHours) * 100;

  // Time markers (every 12 hours)
  const timeMarkers = useMemo(() => {
    const markers = [];
    const interval = 12;
    for (let t = 0; t <= embryo.observationDurationHours; t += interval) {
      markers.push({
        time: t,
        percent: (t / embryo.observationDurationHours) * 100
      });
    }
    return markers;
  }, [embryo.observationDurationHours]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const targetTime = (percent / 100) * embryo.observationDurationHours;
    
    // Find closest frame
    let closestIndex = 0;
    let minDiff = Math.abs(embryo.frames[0].timeHours - targetTime);
    
    for (let i = 1; i < embryo.frames.length; i++) {
      const diff = Math.abs(embryo.frames[i].timeHours - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    onFrameChange(closestIndex);
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Development Timeline</h3>
      
      {/* Timeline visualization */}
      <div className="space-y-2">
        {/* Time markers */}
        <div className="relative h-6">
          {timeMarkers.map((marker, idx) => (
            <div 
              key={idx}
              className="absolute top-0"
              style={{ left: `${marker.percent}%` }}
            >
              <div className="relative -translate-x-1/2">
                <div className="h-2 w-px bg-slate-300"></div>
                <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                  {marker.time}h
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stage segments */}
        <div 
          className="relative h-12 bg-slate-100 rounded cursor-pointer"
          onClick={handleTimelineClick}
        >
          {timelineSegments.map((segment, idx) => (
            <div
              key={idx}
              className="absolute top-0 h-full group"
              style={{
                left: `${segment.startPercent}%`,
                width: `${segment.widthPercent}%`,
                backgroundColor: STAGE_COLORS[segment.stage] || '#94a3b8'
              }}
            >
              {/* Segment label */}
              {segment.widthPercent > 8 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white drop-shadow">
                    {segment.stage}
                  </span>
                </div>
              )}
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <div className="font-semibold">{segment.stage}</div>
                  <div className="text-slate-300">
                    {segment.startTime.toFixed(1)}h - {segment.endTime.toFixed(1)}h
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    {segment.isGroundTruth ? 'Ground Truth' : 'Model Prediction'}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current position cursor */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-red-600 z-20 pointer-events-none"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600 pt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Current position ({currentFrame.timeHours.toFixed(1)}h)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
            <span>Ground truth transitions</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>Model predictions</span>
          </div>
        </div>
      </div>

      {/* Current frame info */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-slate-600 text-xs">Current Time</div>
          <div className="font-mono font-semibold">{currentFrame.timeHours.toFixed(2)}h</div>
        </div>
        <div>
          <div className="text-slate-600 text-xs">Current Stage</div>
          <div className="font-mono font-semibold">{currentFrame.predictedStage}</div>
        </div>
        <div>
          <div className="text-slate-600 text-xs">Frame Index</div>
          <div className="font-mono font-semibold">{currentFrame.index}</div>
        </div>
      </div>
    </div>
  );
}
