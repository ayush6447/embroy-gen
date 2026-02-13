import { Embryo } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface FrameAnalyticsProps {
  embryo: Embryo;
  currentFrameIndex: number;
}

export function FrameAnalytics({ embryo, currentFrameIndex }: FrameAnalyticsProps) {
  const currentFrame = embryo.frames[currentFrameIndex];

  // Prepare data for morphological change chart
  const morphologyData = embryo.frames.map(frame => ({
    time: frame.timeHours,
    change: frame.morphologicalChange,
    frameIndex: frame.index
  }));

  // Prepare data for confidence chart
  const confidenceData = embryo.frames.map(frame => ({
    time: frame.timeHours,
    confidence: frame.confidence,
    frameIndex: frame.index
  }));

  return (
    <div className="bg-white border rounded-lg p-4 space-y-6">
      <h3 className="text-sm font-semibold text-slate-900">Frame-Level Analytics</h3>

      {/* Morphological Change Velocity */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">
          Morphological Change Magnitude
        </h4>
        <p className="text-xs text-slate-600 mb-3">
          Frame-to-frame change detection. Peaks indicate developmental transitions or anomalies.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={morphologyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11 }}
              stroke="#64748b"
              label={{ 
                value: 'Time (hours)', 
                position: 'insideBottom', 
                offset: -5,
                style: { fontSize: 11 }
              }}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#64748b"
              domain={[0, 1]}
              label={{ 
                value: 'Change', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 11 }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                fontSize: 11, 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0' 
              }}
              labelFormatter={(value) => `${value.toFixed(2)}h`}
              formatter={(value: any) => [value.toFixed(3), 'Change']}
            />
            <ReferenceLine 
              x={currentFrame.timeHours} 
              stroke="#dc2626" 
              strokeWidth={2}
              label={{ 
                value: 'Current', 
                position: 'top',
                style: { fontSize: 10, fill: '#dc2626' }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="change" 
              stroke="#64748b" 
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600 font-mono">
          Current value: {currentFrame.morphologicalChange.toFixed(3)}
        </div>
      </div>

      {/* Model Confidence Over Time */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">
          Model Confidence Over Time
        </h4>
        <p className="text-xs text-slate-600 mb-3">
          AI prediction confidence. Sudden drops may indicate uncertain transitions or artifacts.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={confidenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11 }}
              stroke="#64748b"
              label={{ 
                value: 'Time (hours)', 
                position: 'insideBottom', 
                offset: -5,
                style: { fontSize: 11 }
              }}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#64748b"
              domain={[60, 100]}
              label={{ 
                value: 'Confidence (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 11 }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                fontSize: 11, 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0' 
              }}
              labelFormatter={(value) => `${value.toFixed(2)}h`}
              formatter={(value: any) => [value.toFixed(1) + '%', 'Confidence']}
            />
            <ReferenceLine 
              x={currentFrame.timeHours} 
              stroke="#dc2626" 
              strokeWidth={2}
              label={{ 
                value: 'Current', 
                position: 'top',
                style: { fontSize: 10, fill: '#dc2626' }
              }}
            />
            {/* Reference line for 90% confidence threshold */}
            <ReferenceLine 
              y={90} 
              stroke="#10b981" 
              strokeDasharray="3 3"
              label={{ 
                value: 'High confidence', 
                position: 'right',
                style: { fontSize: 10, fill: '#10b981' }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="confidence" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600 font-mono">
          Current value: {currentFrame.confidence.toFixed(1)}%
        </div>
      </div>

      {/* Anomaly frames */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Detected Anomalies</h4>
        <div className="space-y-1">
          {embryo.frames.filter(f => f.anomalyFlag).length > 0 ? (
            embryo.frames
              .filter(f => f.anomalyFlag)
              .slice(0, 5)
              .map((frame, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between text-xs py-1.5 px-2 bg-amber-50 rounded border border-amber-200"
                >
                  <span className="font-mono text-slate-900">
                    Frame {frame.index}
                  </span>
                  <span className="text-slate-600">
                    {frame.timeHours.toFixed(1)}h
                  </span>
                  <span className="text-amber-700">
                    {frame.anomalyFlag}
                  </span>
                </div>
              ))
          ) : (
            <div className="text-xs text-slate-500 py-2">
              No anomalies detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
