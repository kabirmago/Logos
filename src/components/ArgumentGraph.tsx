import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArgumentNode } from '../services/geminiService';
import { Maximize2 } from 'lucide-react';

interface ArgumentGraphProps {
  nodes: ArgumentNode[];
  onNodeClick?: (node: ArgumentNode) => void;
}

export const ArgumentGraph: React.FC<ArgumentGraphProps> = ({ nodes, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(nodes.filter(n => n.parentId).map(n => ({
        source: n.parentId,
        target: n.id
      }))).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    const links = nodes.filter(n => n.parentId).map(n => ({
      source: nodes.find(node => node.id === n.parentId),
      target: n
    }));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#141414')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => onNodeClick?.(d))
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => {
        switch (d.type) {
          case 'claim': return '#E4E3E0';
          case 'evidence': return '#141414';
          case 'rebuttal': return '#F27D26';
          case 'concession': return '#5A5A40';
          default: return '#ccc';
        }
      })
      .attr('stroke', '#141414')
      .attr('stroke-width', 2);

    node.append('text')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace')
      .text(d => d.author.length > 10 ? d.author.substring(0, 8) + '...' : d.author);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    svg.transition()
      .duration(750)
      .call(
        (d3.zoom() as any).transform,
        d3.zoomIdentity
      );
  };

  return (
    <div className="w-full h-[400px] border border-black/10 bg-white/50 rounded-lg overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      <button 
        onClick={handleResetZoom}
        className="absolute top-4 right-4 bg-white/80 border border-black/10 p-1.5 rounded hover:bg-white transition-colors shadow-sm"
        title="Reset Zoom"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-mono uppercase tracking-wider bg-white/80 p-2 rounded border border-black/5">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#E4E3E0] border border-black/20"></div> Claim</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#141414]"></div> Evidence</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F27D26]"></div> Rebuttal</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#5A5A40]"></div> Concession</div>
      </div>
    </div>
  );
};
