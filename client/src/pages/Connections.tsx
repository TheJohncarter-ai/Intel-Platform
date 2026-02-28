import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft, Network, Building2, Calendar, Briefcase, Globe2,
  Filter, ZoomIn, ZoomOut, Maximize2, Loader2
} from "lucide-react";
import * as d3Force from "d3-force";
import * as d3Selection from "d3-selection";
import * as d3Zoom from "d3-zoom";
import * as d3Drag from "d3-drag";

// ─── Types ───────────────────────────────────────────────────────────
type GraphNode = {
  id: number;
  name: string;
  role: string | null;
  organization: string | null;
  sector: string | null;
  event: string | null;
  tier: string | null;
  location: string | null;
  connectionCount: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type GraphEdge = {
  source: number | GraphNode;
  target: number | GraphNode;
  type: string;
  label: string;
};

// ─── Color Palette ───────────────────────────────────────────────────
const EDGE_COLORS: Record<string, string> = {
  organization: "#f59e0b", // amber
  event: "#06b6d4",        // cyan
  sector: "#8b5cf6",       // violet
  company: "#10b981",      // emerald
};

const EDGE_LABELS: Record<string, string> = {
  organization: "Same Organization",
  event: "Same Event",
  sector: "Same Sector",
  company: "Same Company",
};

const TIER_COLORS: Record<string, string> = {
  "1": "#f59e0b",
  "2": "#06b6d4",
  "3": "#8b5cf6",
};

// ─── Main Component ─────────────────────────────────────────────────
export default function Connections() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(["organization", "event", "sector", "company"]));
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });
  const simulationRef = useRef<d3Force.Simulation<GraphNode, GraphEdge> | null>(null);

  const { data: graphData, isLoading } = trpc.connections.graph.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(500, rect.height) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Filter edges
  const filteredEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter(e => activeFilters.has(e.type));
  }, [graphData, activeFilters]);

  // Nodes that have connections
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<number>();
    for (const e of filteredEdges) {
      ids.add(typeof e.source === "number" ? e.source : (e.source as unknown as GraphNode).id);
      ids.add(typeof e.target === "number" ? e.target : (e.target as unknown as GraphNode).id);
    }
    return ids;
  }, [filteredEdges]);

  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter(n => connectedNodeIds.has(n.id));
  }, [graphData, connectedNodeIds]);

  // Toggle filter
  const toggleFilter = useCallback((type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const svg = d3Selection.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create zoom group
    const g = svg.append("g");

    const zoom = d3Zoom.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Prepare data (deep copy to avoid mutation)
    const nodes: GraphNode[] = filteredNodes.map(n => ({ ...n }));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edges: GraphEdge[] = filteredEdges
      .filter(e => {
        const sId = typeof e.source === "number" ? e.source : (e.source as GraphNode).id;
        const tId = typeof e.target === "number" ? e.target : (e.target as GraphNode).id;
        return nodeMap.has(sId) && nodeMap.has(tId);
      })
      .map(e => ({
        ...e,
        source: typeof e.source === "number" ? e.source : (e.source as GraphNode).id,
        target: typeof e.target === "number" ? e.target : (e.target as GraphNode).id,
      }));

    // Force simulation
    const simulation = d3Force.forceSimulation<GraphNode>(nodes)
      .force("link", d3Force.forceLink<GraphNode, any>(edges)
        .id((d: any) => d.id)
        .distance(120)
        .strength(0.3))
      .force("charge", d3Force.forceManyBody().strength(-300))
      .force("center", d3Force.forceCenter(width / 2, height / 2))
      .force("collision", d3Force.forceCollide().radius(30));

    simulationRef.current = simulation;

    // Draw edges
    const link = g.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d: any) => EDGE_COLORS[d.type] || "#334155")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("mouseover", (_event: any, d: GraphNode) => setHoveredNode(d))
      .on("mouseout", () => setHoveredNode(null))
      .on("click", (_event: any, d: GraphNode) => {
        setSelectedNode(prev => prev?.id === d.id ? null : d);
      });

    // Drag behavior
    const drag = d3Drag.drag<SVGGElement, GraphNode>()
      .on("start", (event: any, d: GraphNode) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event: any, d: GraphNode) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event: any, d: GraphNode) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    // Node circles
    node.append("circle")
      .attr("r", (d: GraphNode) => Math.max(8, Math.min(20, 6 + d.connectionCount * 0.5)))
      .attr("fill", (d: GraphNode) => TIER_COLORS[d.tier || "3"] || "#64748b")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    // Node labels
    node.append("text")
      .text((d: GraphNode) => d.name.length > 18 ? d.name.substring(0, 16) + "…" : d.name)
      .attr("dy", (d: GraphNode) => -(Math.max(8, Math.min(20, 6 + d.connectionCount * 0.5)) + 6))
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "'JetBrains Mono', monospace")
      .attr("pointer-events", "none");

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredEdges, dimensions]);

  // Zoom controls
  const handleZoom = useCallback((factor: number) => {
    if (!svgRef.current) return;
    const svg = d3Selection.select(svgRef.current);
    const zoom = d3Zoom.zoom<SVGSVGElement, unknown>();
    svg.transition().duration(300).call(zoom.scaleBy as any, factor);
  }, []);

  const handleReset = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3Selection.select(svgRef.current);
    const zoom = d3Zoom.zoom<SVGSVGElement, unknown>();
    svg.transition().duration(500).call(
      zoom.transform as any,
      d3Zoom.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(0.8).translate(-dimensions.width / 2, -dimensions.height / 2)
    );
  }, [dimensions]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Stats
  const edgeCounts = filteredEdges.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-[#0a0e1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">Back</span>
          </Link>

          <div className="h-5 w-px bg-slate-700" />

          <Network className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-mono uppercase tracking-wider text-amber-400">
            Network Connections
          </h1>

          <div className="flex-1" />

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500">
            <span><span className="text-slate-300">{filteredNodes.length}</span> NODES</span>
            <span><span className="text-slate-300">{filteredEdges.length}</span> EDGES</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Filters */}
        <aside className="w-56 lg:w-64 border-r border-slate-800/50 bg-[#0b1020] p-4 flex flex-col gap-4 overflow-y-auto hidden md:flex">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Relationship Types
            </h3>
            <div className="space-y-2">
              {Object.entries(EDGE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                    activeFilters.has(type)
                      ? "bg-slate-800/80 text-slate-200"
                      : "bg-transparent text-slate-600 hover:text-slate-400"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activeFilters.has(type) ? EDGE_COLORS[type] : "#334155" }}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-slate-600">{edgeCounts[type] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Legend */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">Node Size</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Larger nodes have more connections. Color indicates tier level.
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Tier 1
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-cyan-500" /> Tier 2
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-violet-500" /> Tier 3
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Zoom Controls */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">Controls</h3>
            <div className="flex gap-2">
              <button onClick={() => handleZoom(1.3)} className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => handleZoom(0.7)} className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={handleReset} className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Graph Area */}
        <main ref={containerRef} className="flex-1 relative overflow-hidden">
          {/* Mobile filter pills */}
          <div className="md:hidden absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2">
            {Object.entries(EDGE_LABELS).map(([type, label]) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono transition-all ${
                  activeFilters.has(type)
                    ? "bg-slate-800/90 text-slate-200 border border-slate-700"
                    : "bg-slate-900/60 text-slate-600 border border-slate-800/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilters.has(type) ? EDGE_COLORS[type] : "#334155" }} />
                {label.replace("Same ", "")}
              </button>
            ))}
          </div>

          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            style={{ background: "transparent" }}
          />

          {/* Hover tooltip */}
          {hoveredNode && !selectedNode && (
            <div className="absolute top-4 right-4 bg-[#0f1629]/95 border border-slate-700/50 rounded-xl p-4 max-w-xs backdrop-blur-sm pointer-events-none z-20">
              <h4 className="text-sm font-semibold text-slate-100">{hoveredNode.name}</h4>
              {hoveredNode.role && <p className="text-xs text-slate-400 mt-1">{hoveredNode.role}</p>}
              {hoveredNode.organization && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {hoveredNode.organization}
                </p>
              )}
              <p className="text-xs text-amber-400/70 mt-2 font-mono">
                {hoveredNode.connectionCount} connections
              </p>
            </div>
          )}

          {/* Selected node detail panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 bg-[#0f1629]/95 border border-slate-700/50 rounded-xl p-5 max-w-sm backdrop-blur-sm z-20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{selectedNode.name}</h4>
                  {selectedNode.role && <p className="text-xs text-slate-400 mt-0.5">{selectedNode.role}</p>}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              </div>

              {selectedNode.organization && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Building2 className="w-3 h-3" /> {selectedNode.organization}
                </div>
              )}
              {selectedNode.sector && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Briefcase className="w-3 h-3" /> {selectedNode.sector}
                </div>
              )}
              {selectedNode.event && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Calendar className="w-3 h-3" /> {selectedNode.event}
                </div>
              )}
              {selectedNode.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Globe2 className="w-3 h-3" /> {selectedNode.location}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400/70">{selectedNode.connectionCount} connections</span>
                <Link
                  href={`/profile/${selectedNode.id}`}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredNodes.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No connections found with current filters</p>
                <p className="text-xs text-slate-600 mt-1">Try enabling more relationship types</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
