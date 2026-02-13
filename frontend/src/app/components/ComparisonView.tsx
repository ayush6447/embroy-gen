import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { mockCohortData } from "../data/mockData";
import { Embryo } from "../types";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { DevelopmentTimeline } from "./DevelopmentTimeline";

export function ComparisonView() {
  const [searchParams] = useSearchParams();
  const embryoIds = searchParams.get('embryos')?.split(',') || [];
  
  const embryos = embryoIds
    .map(id => mockCohortData.embryos.find(e => e.id === id))
    .filter((e): e is Embryo => e !== undefined)
    .slice(0, 3); // Maximum 3 embryos

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);

  // Find the maximum number of frames across all embryos
  const maxFrames = Math.max(...embryos.map(e => e.frames.length));

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev >= maxFrames - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, maxFrames]);

  if (embryos.length < 2) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Comparison View</h1>
          <p className="text-slate-600 mb-6">
            Please select at least 2 embryos from the cohort view to compare.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Cohort View
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-semibold text-slate-900">Embryo Comparison</h1>
            <p className="text-sm text-slate-600">
              Comparing {embryos.length} embryos side-by-side
            </p>
          </div>
        </div>
      </div>

      {/* Synchronized playback controls */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Speed:</span>
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

          <div className="flex-1">
            <Slider
              value={[currentFrameIndex]}
              onValueChange={([value]) => setCurrentFrameIndex(value)}
              max={maxFrames - 1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="text-sm text-slate-600 font-mono min-w-[120px] text-right">
            Frame {currentFrameIndex + 1} / {maxFrames}
          </div>
        </div>
      </div>

      {/* Comparison grid */}
      <div className={`grid grid-cols-1 ${embryos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
        {embryos.map((embryo) => {
          const frameIndex = Math.min(currentFrameIndex, embryo.frames.length - 1);
          const currentFrame = embryo.frames[frameIndex];

          return (
            <div key={embryo.id} className="space-y-4">
              {/* Embryo header */}
              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{embryo.id}</h2>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Viability:</span>
                    <span className={`font-mono font-semibold ${
                      embryo.modelOutput.viabilityScore >= 0.8 ? 'text-emerald-700' :
                      embryo.modelOutput.viabilityScore >= 0.7 ? 'text-slate-900' :
                      'text-amber-700'
                    }`}>
                      {embryo.modelOutput.viabilityScore.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Development:</span>
                    <span className="font-semibold">{embryo.developmentSpeed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Blastocyst:</span>
                    <span className={embryo.blastocystFormation ? 'text-emerald-700' : 'text-slate-500'}>
                      {embryo.blastocystFormation ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frame viewer */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-radial from-slate-700 to-slate-900"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-slate-600/30 border-2 border-slate-500/50 flex items-center justify-center">
                      <div className="text-slate-400 text-xs">Frame {frameIndex}</div>
                    </div>
                  </div>

                  {/* Overlays */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-mono">
                    {currentFrame.predictedStage}
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-mono">
                    {currentFrame.confidence.toFixed(1)}%
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-mono">
                    {currentFrame.timeHours.toFixed(2)}h
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <DevelopmentTimeline 
                embryo={embryo}
                currentFrameIndex={frameIndex}
                onFrameChange={setCurrentFrameIndex}
              />

              {/* Key metrics */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-slate-700 mb-3">Development Times</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">t2:</span>
                    <span className="font-mono font-semibold">{embryo.timeToT2?.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">t3:</span>
                    <span className="font-mono font-semibold">{embryo.timeToT3?.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">t5:</span>
                    <span className="font-mono font-semibold">{embryo.timeToT5?.toFixed(1)}h</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="text-slate-600">t2→t3:</span>
                    <span className="font-mono font-semibold">
                      {embryo.timeToT2 && embryo.timeToT3 
                        ? (embryo.timeToT3 - embryo.timeToT2).toFixed(1) + 'h'
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">t3→t5:</span>
                    <span className="font-mono font-semibold">
                      {embryo.timeToT3 && embryo.timeToT5
                        ? (embryo.timeToT5 - embryo.timeToT3).toFixed(1) + 'h'
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk factors */}
              {embryo.modelOutput.riskFactors.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-slate-700 mb-3">Risk Factors</h3>
                  <div className="space-y-1">
                    {embryo.modelOutput.riskFactors.map((rf, idx) => (
                      <div key={idx} className="text-xs flex items-start justify-between gap-2">
                        <span className="text-slate-700 flex-1">{rf.name}</span>
                        <span className={`font-mono font-semibold whitespace-nowrap ${
                          rf.impact > 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {rf.impact > 0 ? '+' : ''}{rf.impact.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison summary */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Comparative Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold text-slate-700">Metric</th>
                {embryos.map(embryo => (
                  <th key={embryo.id} className="text-right py-2 font-semibold text-slate-700">
                    {embryo.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 text-slate-600">Viability Score</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono font-semibold">
                    {embryo.modelOutput.viabilityScore.toFixed(3)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Model Confidence</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono">
                    {embryo.modelOutput.confidence.toFixed(1)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Time to t2</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono">
                    {embryo.timeToT2?.toFixed(1)}h
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Time to t3</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono">
                    {embryo.timeToT3?.toFixed(1)}h
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Time to t5</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono">
                    {embryo.timeToT5?.toFixed(1)}h
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Blastocyst Formation</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2">
                    {embryo.blastocystFormation ? '✓' : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Development Speed</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2">
                    {embryo.developmentSpeed}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Total Frames</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono">
                    {embryo.totalFrames}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Observation Duration</td>
                {embryos.map(embryo => (
                  <td key={embryo.id} className="text-right py-2 font-mono">
                    {embryo.observationDurationHours.toFixed(1)}h
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
