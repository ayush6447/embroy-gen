import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { mockCohortData } from "../data/mockData";
import { Embryo } from "../types";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Search,
  BarChart3,
  Table as TableIcon
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PopulationAnalytics } from "./PopulationAnalytics";

type SortField = keyof Embryo | 'viabilityScore' | 'confidence';
type SortDirection = 'asc' | 'desc' | null;

export function CohortView() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedEmbryos, setSelectedEmbryos] = useState<Set<string>>(new Set());

  const embryos = mockCohortData.embryos;

  // Sorting logic
  const sortedEmbryos = useMemo(() => {
    if (!sortField || !sortDirection) return embryos;

    return [...embryos].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'viabilityScore') {
        aVal = a.modelOutput.viabilityScore;
        bVal = b.modelOutput.viabilityScore;
      } else if (sortField === 'confidence') {
        aVal = a.modelOutput.confidence;
        bVal = b.modelOutput.confidence;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      // Handle undefined values
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [embryos, sortField, sortDirection]);

  // Filter by search
  const filteredEmbryos = useMemo(() => {
    if (!searchTerm) return sortedEmbryos;
    return sortedEmbryos.filter(e => 
      e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedEmbryos, searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4" />;
    return <ArrowDown className="w-4 h-4" />;
  };

  const handleExportCSV = () => {
    const headers = [
      'Embryo ID', 'Total Frames', 'Duration (h)', 'Last Stage',
      't2 (h)', 't3 (h)', 't5 (h)', 'Blastocyst', 'Speed',
      'Viability Score', 'Confidence (%)'
    ];

    const rows = filteredEmbryos.map(e => [
      e.id,
      e.totalFrames,
      e.observationDurationHours,
      e.lastObservedStage,
      e.timeToT2 ?? 'N/A',
      e.timeToT3 ?? 'N/A',
      e.timeToT5 ?? 'N/A',
      e.blastocystFormation ? 'Yes' : 'No',
      e.developmentSpeed,
      e.modelOutput.viabilityScore,
      e.modelOutput.confidence
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `embryo_cohort_${mockCohortData.cycleId}.csv`;
    a.click();
  };

  const toggleEmbryoSelection = (embryoId: string) => {
    const newSet = new Set(selectedEmbryos);
    if (newSet.has(embryoId)) {
      newSet.delete(embryoId);
    } else {
      if (newSet.size < 3) {
        newSet.add(embryoId);
      }
    }
    setSelectedEmbryos(newSet);
  };

  const handleCompare = () => {
    const ids = Array.from(selectedEmbryos);
    navigate(`/compare?embryos=${ids.join(',')}`);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Cohort Analysis: {mockCohortData.cycleId}
        </h1>
        <p className="text-sm text-slate-600">
          {embryos.length} embryos • {embryos.filter(e => e.blastocystFormation).length} reached blastocyst stage
        </p>
      </div>

      <Tabs defaultValue="table" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table">
              <TableIcon className="w-4 h-4 mr-2" />
              Embryo Table
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Population Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            {selectedEmbryos.size > 1 && (
              <Button onClick={handleCompare} variant="default">
                Compare {selectedEmbryos.size} Embryos
              </Button>
            )}
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <TabsContent value="table" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by Embryo ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-slate-600">
              Showing {filteredEmbryos.length} of {embryos.length} embryos
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('id')}
                        className="flex items-center gap-1 font-semibold hover:text-slate-900"
                      >
                        Embryo ID
                        <SortIcon field="id" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('totalFrames')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        Frames
                        <SortIcon field="totalFrames" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('observationDurationHours')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        Duration (h)
                        <SortIcon field="observationDurationHours" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('lastObservedStage')}
                        className="flex items-center gap-1 font-semibold hover:text-slate-900"
                      >
                        Last Stage
                        <SortIcon field="lastObservedStage" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('timeToT2')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        t2 (h)
                        <SortIcon field="timeToT2" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('timeToT3')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        t3 (h)
                        <SortIcon field="timeToT3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('timeToT5')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        t5 (h)
                        <SortIcon field="timeToT5" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button 
                        onClick={() => handleSort('blastocystFormation')}
                        className="flex items-center gap-1 mx-auto font-semibold hover:text-slate-900"
                      >
                        Blastocyst
                        <SortIcon field="blastocystFormation" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('developmentSpeed')}
                        className="flex items-center gap-1 font-semibold hover:text-slate-900"
                      >
                        Speed
                        <SortIcon field="developmentSpeed" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('viabilityScore')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        Viability
                        <SortIcon field="viabilityScore" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => handleSort('confidence')}
                        className="flex items-center gap-1 ml-auto font-semibold hover:text-slate-900"
                      >
                        Confidence
                        <SortIcon field="confidence" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmbryos.map((embryo) => (
                    <TableRow 
                      key={embryo.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input')) return;
                        navigate(`/embryo/${embryo.id}`);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedEmbryos.has(embryo.id)}
                          onChange={() => toggleEmbryoSelection(embryo.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{embryo.id}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{embryo.totalFrames}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{embryo.observationDurationHours}</TableCell>
                      <TableCell className="font-mono text-sm">{embryo.lastObservedStage}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {embryo.timeToT2?.toFixed(1) ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {embryo.timeToT3?.toFixed(1) ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {embryo.timeToT5?.toFixed(1) ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          embryo.blastocystFormation 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {embryo.blastocystFormation ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          embryo.developmentSpeed === 'Fast' ? 'bg-orange-100 text-orange-800' :
                          embryo.developmentSpeed === 'Slow' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {embryo.developmentSpeed}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-sm font-semibold ${
                          embryo.modelOutput.viabilityScore >= 0.8 ? 'text-emerald-700' :
                          embryo.modelOutput.viabilityScore >= 0.7 ? 'text-slate-900' :
                          'text-amber-700'
                        }`}>
                          {embryo.modelOutput.viabilityScore.toFixed(3)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-600">
                        {embryo.modelOutput.confidence.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {filteredEmbryos.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No embryos match the current filters
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <PopulationAnalytics embryos={embryos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
