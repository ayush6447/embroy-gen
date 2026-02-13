import { Embryo } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from "recharts";

interface PopulationAnalyticsProps {
  embryos: Embryo[];
}

export function PopulationAnalytics({ embryos }: PopulationAnalyticsProps) {
  // Time to t2 histogram
  const t2Histogram = (() => {
    const bins: { range: string; count: number }[] = [];
    const binSize = 2; // 2-hour bins
    const minTime = 22;
    const maxTime = 34;

    for (let i = minTime; i < maxTime; i += binSize) {
      const count = embryos.filter(
        e => e.timeToT2 && e.timeToT2 >= i && e.timeToT2 < i + binSize
      ).length;
      bins.push({
        range: `${i}-${i + binSize}h`,
        count
      });
    }
    return bins;
  })();

  // Time to t3 histogram
  const t3Histogram = (() => {
    const bins: { range: string; count: number }[] = [];
    const binSize = 3;
    const minTime = 33;
    const maxTime = 48;

    for (let i = minTime; i < maxTime; i += binSize) {
      const count = embryos.filter(
        e => e.timeToT3 && e.timeToT3 >= i && e.timeToT3 < i + binSize
      ).length;
      bins.push({
        range: `${i}-${i + binSize}h`,
        count
      });
    }
    return bins;
  })();

  // Time to t5 histogram
  const t5Histogram = (() => {
    const bins: { range: string; count: number }[] = [];
    const binSize = 3;
    const minTime = 45;
    const maxTime = 63;

    for (let i = minTime; i < maxTime; i += binSize) {
      const count = embryos.filter(
        e => e.timeToT5 && e.timeToT5 >= i && e.timeToT5 < i + binSize
      ).length;
      bins.push({
        range: `${i}-${i + binSize}h`,
        count
      });
    }
    return bins;
  })();

  // Box plot data (simplified as min/q1/median/q3/max)
  const calculateBoxPlotData = (field: 'timeToT2' | 'timeToT3' | 'timeToT5') => {
    const values = embryos
      .map(e => e[field])
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    const q1Index = Math.floor(values.length * 0.25);
    const medianIndex = Math.floor(values.length * 0.5);
    const q3Index = Math.floor(values.length * 0.75);

    return {
      min: values[0],
      q1: values[q1Index],
      median: values[medianIndex],
      q3: values[q3Index],
      max: values[values.length - 1]
    };
  };

  const t2BoxPlot = calculateBoxPlotData('timeToT2');
  const t3BoxPlot = calculateBoxPlotData('timeToT3');
  const t5BoxPlot = calculateBoxPlotData('timeToT5');

  // Scatter plot: time to blastocyst vs viability
  const scatterData = embryos
    .filter(e => e.blastocystFormation)
    .map(e => {
      const blastocystTransition = e.stageTransitions.find(t => t.stage === 'tB');
      return {
        embryoId: e.id,
        timeToBlastocyst: blastocystTransition?.timeHours ?? 0,
        viability: e.modelOutput.viabilityScore,
        speed: e.developmentSpeed
      };
    });

  const getColorForSpeed = (speed: string) => {
    switch (speed) {
      case 'Fast': return '#f97316'; // orange
      case 'Slow': return '#3b82f6'; // blue
      default: return '#64748b'; // slate
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Development Time Distributions
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* t2 Histogram */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Time to t2 (hours)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={t2Histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 12, backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
            {t2BoxPlot && (
              <div className="mt-3 text-xs text-slate-600 font-mono">
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <div className="text-slate-500">Min</div>
                    <div className="font-semibold">{t2BoxPlot.min.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Q1</div>
                    <div className="font-semibold">{t2BoxPlot.q1.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Median</div>
                    <div className="font-semibold">{t2BoxPlot.median.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Q3</div>
                    <div className="font-semibold">{t2BoxPlot.q3.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Max</div>
                    <div className="font-semibold">{t2BoxPlot.max.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* t3 Histogram */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Time to t3 (hours)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={t3Histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 12, backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
            {t3BoxPlot && (
              <div className="mt-3 text-xs text-slate-600 font-mono">
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <div className="text-slate-500">Min</div>
                    <div className="font-semibold">{t3BoxPlot.min.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Q1</div>
                    <div className="font-semibold">{t3BoxPlot.q1.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Median</div>
                    <div className="font-semibold">{t3BoxPlot.median.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Q3</div>
                    <div className="font-semibold">{t3BoxPlot.q3.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Max</div>
                    <div className="font-semibold">{t3BoxPlot.max.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* t5 Histogram */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Time to t5 (hours)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={t5Histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 12, backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
            {t5BoxPlot && (
              <div className="mt-3 text-xs text-slate-600 font-mono">
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <div className="text-slate-500">Min</div>
                    <div className="font-semibold">{t5BoxPlot.min.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Q1</div>
                    <div className="font-semibold">{t5BoxPlot.q1.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Median</div>
                    <div className="font-semibold">{t5BoxPlot.median.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Q3</div>
                    <div className="font-semibold">{t5BoxPlot.q3.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Max</div>
                    <div className="font-semibold">{t5BoxPlot.max.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scatter plot */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Time to Blastocyst vs. Viability Score
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          {scatterData.length} embryos with confirmed blastocyst formation
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="timeToBlastocyst" 
              name="Time to Blastocyst"
              unit="h"
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              label={{ 
                value: 'Time to Blastocyst (hours)', 
                position: 'insideBottom', 
                offset: -10,
                style: { fontSize: 12, fill: '#475569' }
              }}
            />
            <YAxis 
              type="number" 
              dataKey="viability" 
              name="Viability Score"
              domain={[0.5, 0.9]}
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              label={{ 
                value: 'AI Viability Score', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#475569' }
              }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ fontSize: 12, backgroundColor: 'white', border: '1px solid #e2e8f0' }}
              formatter={(value: any, name: string) => {
                if (name === 'Time to Blastocyst') return [value.toFixed(1) + 'h', name];
                if (name === 'Viability Score') return [value.toFixed(3), name];
                return [value, name];
              }}
              labelFormatter={(value) => {
                const point = scatterData.find(d => d.timeToBlastocyst === value);
                return point ? `Embryo: ${point.embryoId}` : '';
              }}
            />
            <Scatter name="Embryos" data={scatterData}>
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorForSpeed(entry.speed)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-700">Fast Development</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-slate-700">Normal Development</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-700">Slow Development</span>
          </div>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Mean Viability Score</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {(embryos.reduce((sum, e) => sum + e.modelOutput.viabilityScore, 0) / embryos.length).toFixed(3)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Blastocyst Formation Rate</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {((embryos.filter(e => e.blastocystFormation).length / embryos.length) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Mean t2 Time</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {(embryos.reduce((sum, e) => sum + (e.timeToT2 ?? 0), 0) / embryos.length).toFixed(1)}h
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Mean Observation Duration</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {(embryos.reduce((sum, e) => sum + e.observationDurationHours, 0) / embryos.length).toFixed(1)}h
          </div>
        </div>
      </div>
    </div>
  );
}
