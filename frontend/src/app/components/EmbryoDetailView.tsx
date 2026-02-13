import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { mockCohortData } from "../data/mockData";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Download,
  Info
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DevelopmentTimeline } from "./DevelopmentTimeline";
import { FrameAnalytics } from "./FrameAnalytics";
import { ModelOutputPanel } from "./ModelOutputPanel";

export function EmbryoDetailView() {
  const { embryoId } = useParams<{ embryoId: string }>();
  const embryo = mockCohortData.embryos.find(e => e.id === embryoId);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10); // frames per second
  const [showStageOverlay, setShowStageOverlay] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(true);

  useEffect(() => {
    if (!isPlaying || !embryo) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev >= embryo.frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, embryo]);

  if (!embryo) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Embryo Not Found</h1>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Cohort View
          </Link>
        </div>
      </div>
    );
  }

  const currentFrame = embryo.frames[currentFrameIndex];

  const handleExportReport = () => {
    alert('PDF report export would be generated here with all embryo data, charts, and analysis.');
  };

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cohort View
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Embryo {embryo.id}</h1>
            <p className="text-sm text-slate-600">
              {embryo.totalFrames} frames • {embryo.observationDurationHours}h observation • 
              Viability: {embryo.modelOutput.viabilityScore.toFixed(3)}
            </p>
          </div>
        </div>
        <Button onClick={handleExportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Frame viewer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Frame display */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
              {/* Simulated microscopy image */}
              <div className="absolute inset-0 bg-gradient-radial from-slate-700 to-slate-900"></div>
              <div className="relative z-10 text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-slate-600/30 border-2 border-slate-500/50 flex items-center justify-center">
                  <div className="text-slate-400 text-xs">Frame {currentFrame.index}</div>
                </div>
                <div className="text-slate-500 text-sm">Time-lapse microscopy simulation</div>
              </div>

              {/* Overlays */}
              {showStageOverlay && (
                <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1.5 rounded text-sm font-mono">
                  Stage: {currentFrame.predictedStage}
                </div>
              )}
              {showConfidence && (
                <div className="absolute top-4 right-4 bg-slate-900/80 text-white px-3 py-1.5 rounded text-sm font-mono">
                  Confidence: {currentFrame.confidence.toFixed(1)}%
                </div>
              )}
              {showAnomalies && currentFrame.anomalyFlag && (
                <div className="absolute bottom-4 left-4 bg-amber-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {currentFrame.anomalyFlag}
                </div>
              )}

              {/* Frame info */}
              <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white px-3 py-1.5 rounded text-sm font-mono">
                {currentFrame.timeHours.toFixed(2)}h
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                  disabled={currentFrameIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentFrameIndex(Math.min(embryo.frames.length - 1, currentFrameIndex + 1))}
                  disabled={currentFrameIndex === embryo.frames.length - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[currentFrameIndex]}
                    onValueChange={([value]) => setCurrentFrameIndex(value)}
                    max={embryo.frames.length - 1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="text-sm text-slate-600 font-mono min-w-[120px] text-right">
                  Frame {currentFrameIndex + 1} / {embryo.frames.length}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Speed:</Label>
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={5}>0.5x</option>
                    <option value={10}>1x</option>
                    <option value={20}>2x</option>
                    <option value={40}>4x</option>
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-300"></div>

                <div className="flex items-center gap-2">
                  <Switch 
                    id="stage-overlay"
                    checked={showStageOverlay}
                    onCheckedChange={setShowStageOverlay}
                  />
                  <Label htmlFor="stage-overlay" className="text-sm cursor-pointer">
                    Stage Label
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    id="confidence-overlay"
                    checked={showConfidence}
                    onCheckedChange={setShowConfidence}
                  />
                  <Label htmlFor="confidence-overlay" className="text-sm cursor-pointer">
                    Confidence
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    id="anomaly-overlay"
                    checked={showAnomalies}
                    onCheckedChange={setShowAnomalies}
                  />
                  <Label htmlFor="anomaly-overlay" className="text-sm cursor-pointer">
                    Anomalies
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <DevelopmentTimeline 
            embryo={embryo} 
            currentFrameIndex={currentFrameIndex}
            onFrameChange={setCurrentFrameIndex}
          />

          {/* Analytics graphs */}
          <FrameAnalytics embryo={embryo} currentFrameIndex={currentFrameIndex} />
        </div>

        {/* Right column: Model output and metrics */}
        <div className="space-y-4">
          <ModelOutputPanel embryo={embryo} />

          {/* Key metrics */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Development Metrics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Time to t2:</span>
                <span className="font-mono font-semibold">{embryo.timeToT2?.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time to t3:</span>
                <span className="font-mono font-semibold">{embryo.timeToT3?.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time to t5:</span>
                <span className="font-mono font-semibold">{embryo.timeToT5?.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">t2→t3 interval:</span>
                <span className="font-mono font-semibold">
                  {embryo.timeToT2 && embryo.timeToT3 
                    ? (embryo.timeToT3 - embryo.timeToT2).toFixed(1) + 'h'
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">t3→t5 interval:</span>
                <span className="font-mono font-semibold">
                  {embryo.timeToT3 && embryo.timeToT5
                    ? (embryo.timeToT5 - embryo.timeToT3).toFixed(1) + 'h'
                    : '—'}
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between">
                <span className="text-slate-600">Blastocyst:</span>
                <span className={`font-semibold ${embryo.blastocystFormation ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {embryo.blastocystFormation ? 'Confirmed' : 'Not observed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Development speed:</span>
                <span className="font-semibold">{embryo.developmentSpeed}</span>
              </div>
            </div>
          </div>

          {/* Stage transitions */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Stage Transitions</h3>
            <div className="space-y-2 text-xs">
              {embryo.stageTransitions.map((transition, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {transition.stage}
                    </span>
                    {transition.isGroundTruth ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px]">
                        GT
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                        AI
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-600">
                    {transition.timeHours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              GT = Ground Truth (manual annotation) • AI = Model prediction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
