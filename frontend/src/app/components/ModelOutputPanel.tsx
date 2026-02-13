import { Embryo } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface ModelOutputPanelProps {
  embryo: Embryo;
}

export function ModelOutputPanel({ embryo }: ModelOutputPanelProps) {
  const { modelOutput } = embryo;

  // Prepare risk factors for visualization
  const riskFactorData = modelOutput.riskFactors.map(rf => ({
    name: rf.name,
    impact: rf.impact,
    importance: rf.importance
  }));

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">AI Model Output</h3>
        
        {/* Viability score */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-slate-600">Viability Score</span>
            <div className="text-right">
              <span className="text-3xl font-semibold text-slate-900 font-mono">
                {modelOutput.viabilityScore.toFixed(3)}
              </span>
              <span className="text-sm text-slate-500 ml-2">
                ({(modelOutput.viabilityScore * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                modelOutput.viabilityScore >= 0.8 ? 'bg-emerald-600' :
                modelOutput.viabilityScore >= 0.7 ? 'bg-blue-600' :
                'bg-amber-600'
              }`}
              style={{ width: `${modelOutput.viabilityScore * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Model confidence */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-slate-600">Model Confidence</span>
            <span className="text-xl font-semibold text-slate-900 font-mono">
              {modelOutput.confidence.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${modelOutput.confidence}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Risk factors breakdown */}
      {riskFactorData.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-3">Risk Factors</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart 
              data={riskFactorData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                domain={[-0.3, 0.3]}
                tick={{ fontSize: 10 }}
                stroke="#64748b"
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 10 }}
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: 11, 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0' 
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'impact') {
                    return [value.toFixed(3), 'Impact'];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                {riskFactorData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.impact > 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {modelOutput.riskFactors.map((rf, idx) => (
              <div key={idx} className="text-xs flex items-center justify-between py-1">
                <span className="text-slate-700">{rf.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    Importance: {(rf.importance * 100).toFixed(0)}%
                  </span>
                  <span className={`font-mono font-semibold ${
                    rf.impact > 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {rf.impact > 0 ? '+' : ''}{rf.impact.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensitivity insights */}
      {modelOutput.sensitivityInsights.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Interpretability</h4>
          <div className="space-y-2">
            {modelOutput.sensitivityInsights.map((insight, idx) => (
              <div 
                key={idx}
                className="text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded p-2"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model metadata */}
      <div className="pt-3 border-t">
        <div className="text-xs text-slate-500 space-y-1">
          <div>Model: EmbryogenAI v2.1.3</div>
          <div>Analysis date: 2026-02-12 14:23:47 UTC</div>
          <div>Dataset: Clinical validation cohort</div>
        </div>
      </div>
    </div>
  );
}