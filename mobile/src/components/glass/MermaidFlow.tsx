import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text as RNText, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { glassRadius, useTheme, type GlassTheme } from '@/theme';

/**
 * Minimal Mermaid flowchart renderer for AI chat — the mobile mirror of the web
 * chat's MermaidBlock. Covers the flowchart subset Aether actually emits
 * (`graph LR`/`flowchart TD` with `A["label"] --> B["label"]` and `A -->|label| B`).
 * Anything it can't parse falls back to a compact code card instead of crashing.
 */

interface MNode {
  id: string;
  label: string;
}

interface MEdge {
  from: string;
  to: string;
  label?: string;
  dotted?: boolean;
}

interface Graph {
  nodes: MNode[];
  edges: MEdge[];
  direction: 'LR' | 'TD';
  ok: boolean;
}

const ARROW_COLOR = 'rgba(124,96,228,0.55)';
const NODE_FILL = 'rgba(255,255,255,0.8)';
const NODE_STROKE = 'rgba(124,96,228,0.35)';

function parseMermaid(raw: string): Graph {
  const nodes: MNode[] = [];
  const edges: MEdge[] = [];
  let direction: 'LR' | 'TD' = 'LR';
  const nodeIndex = new Map<string, number>();
  const lines = raw.split('\n');
  const defs: Array<{ id: string; label: string }> = [];

  for (let line of lines) {
    line = line.trim().replace(/\s+/g, ' ');
    if (!line) continue;

    const dir = line.match(/^(graph|flowchart)\s+(LR|TD|RL|BT)/i);
    if (dir) {
      const d = dir[2].toUpperCase();
      direction = d === 'TD' || d === 'BT' ? 'TD' : 'LR';
      continue;
    }

    // Collect node definitions wherever they appear, then strip them so the
    // remaining text is just edge arrows. Handles `A["x"] --> B["y"]` on one line.
    const defRe = /([A-Za-z0-9_]+)\s*\[\s*"([^"]*)"\s*\]/g;
    let m: RegExpExecArray | null;
    let rest = line;
    const seen = new Set<string>();
    while ((m = defRe.exec(line))) {
      if (!seen.has(m[1])) {
        defs.push({ id: m[1], label: m[2] });
        seen.add(m[1]);
      }
      rest = rest.replace(m[0], m[1]);
    }

    const withLabel = rest.match(/([A-Za-z0-9_]+)\s*-->\|([^|]+)\|\s*([A-Za-z0-9_]+)/);
    if (withLabel) {
      edges.push({ from: withLabel[1], to: withLabel[3], label: withLabel[2] });
      rest = rest.replace(withLabel[0], withLabel[1] + ' ' + withLabel[3]);
    }

    const edgeRe = /([A-Za-z0-9_]+)\s*(-\.->|-->|---|--)\s*([A-Za-z0-9_]+)/g;
    let em: RegExpExecArray | null;
    while ((em = edgeRe.exec(rest))) {
      const dotted = em[2] === '-.->';
      edges.push({ from: em[1], to: em[3], dotted });
      rest = rest.replace(em[0], em[1] + ' ' + em[3]);
      edgeRe.lastIndex = 0;
    }

    const bare = rest.match(/([A-Za-z0-9_]+)/);
    if (bare && !seen.has(bare[1])) {
      defs.push({ id: bare[1], label: bare[1] });
    }
  }

  for (const d of defs) {
    if (!nodeIndex.has(d.id)) {
      nodeIndex.set(d.id, nodes.length);
      nodes.push({ id: d.id, label: d.label });
    }
  }
  for (const e of edges) {
    for (const id of [e.from, e.to]) {
      if (!nodeIndex.has(id)) {
        nodeIndex.set(id, nodes.length);
        nodes.push({ id, label: id });
      }
    }
  }

  return { nodes, edges, direction, ok: nodes.length > 0 };
}

/** Longest-path layering so edges flow left→right (LR) or top→bottom (TD). */
function layOut(graph: Graph) {
  const incoming = new Map<string, number>();
  const outEdges = new Map<string, MEdge[]>();
  for (const n of graph.nodes) {
    incoming.set(n.id, 0);
    outEdges.set(n.id, []);
  }
  for (const e of graph.edges) {
    if (!incoming.has(e.from) || !incoming.has(e.to)) continue;
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    outEdges.get(e.from)?.push(e);
  }

  const layer = new Map<string, number>();
  const queue: string[] = graph.nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id);
  if (queue.length === 0 && graph.nodes.length > 0) queue.push(graph.nodes[0].id);

  for (const n of graph.nodes) layer.set(n.id, 0);
  while (queue.length) {
    const id = queue.shift()!;
    const next = layer.get(id) ?? 0;
    for (const e of outEdges.get(id) ?? []) {
      layer.set(e.to, Math.max(layer.get(e.to) ?? 0, next + 1));
      queue.push(e.to);
    }
  }

  const byLayer = new Map<number, string[]>();
  for (const n of graph.nodes) {
    const l = layer.get(n.id) ?? 0;
    const list = byLayer.get(l) ?? [];
    list.push(n.id);
    byLayer.set(l, list);
  }
  return { layer, byLayer };
}

interface MermaidFlowProps {
  chart: string;
  style?: StyleProp<ViewStyle>;
}

const NODE_W = 150;
const NODE_H = 46;
const GAP_X = 72;
const GAP_Y = 26;
const PAD = 18;

export function MermaidFlow({ chart, style }: MermaidFlowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width: screenW } = useWindowDimensions();
  const [containerW, setContainerW] = useState(0);

  const { graph, layout } = useMemo(() => {
    const g = parseMermaid(chart);
    if (!g.ok) return { graph: g, layout: null };
    return { graph: g, layout: layOut(g) };
  }, [chart]);

  if (!graph.ok || !layout) {
    return (
      <View style={[styles.fallback, style]}>
        <RNText style={styles.fallbackLabel}>DIAGRAM</RNText>
        <RNText style={styles.fallbackCode}>{chart.trim()}</RNText>
      </View>
    );
  }

  const availW = containerW > 0 ? containerW : Math.max(screenW, 320);

  // Narrow screens force top-down so the widest layer can be sized to fit the
  // column without horizontal scrolling. Wide screens keep the authored LR.
  const isTD = graph.direction === 'TD' || screenW < 600;

  // TD: size nodes so the longest layer run exactly fills the available width.
  const longestRun = Math.max(...[...layout.byLayer.values()].map((ids) => ids.length), 1);
  const nodeW = isTD
    ? Math.max(86, Math.min(NODE_W, (availW - PAD * 2 - (longestRun - 1) * GAP_Y) / longestRun))
    : Math.max(110, Math.min(NODE_W * 1.4, availW - PAD * 2 - GAP_X * 0.6));
  const nodeH = NODE_H;
  const gapX = isTD ? GAP_Y : GAP_X;
  const gapY = isTD ? GAP_X : GAP_Y;

  const pos = new Map<string, { x: number; y: number }>();

  // LR: layers advance right, nodes stack down. TD: layers advance down, nodes stack right.
  let layerCursor = PAD;
  const layerRuns: { ids: string[]; at: number }[] = [];
  for (const layerIds of layout.byLayer.values()) {
    layerRuns.push({ ids: layerIds, at: layerCursor });
    layerCursor += nodeH + gapY;
  }
  for (const run of layerRuns) {
    let stackCursor = PAD;
    for (const id of run.ids) {
      if (isTD) pos.set(id, { x: stackCursor, y: run.at });
      else pos.set(id, { x: run.at, y: stackCursor });
      stackCursor += nodeW + gapX;
    }
  }

  // Center each layer run around the longest one.
  const longest = Math.max(...layerRuns.map((r) => r.ids.length * nodeW + (r.ids.length - 1) * gapX), nodeW);
  for (const run of layerRuns) {
    const runW = run.ids.length * nodeW + (run.ids.length - 1) * gapX;
    const offset = (longest - runW) / 2;
    for (const id of run.ids) {
      const p = pos.get(id)!;
      if (isTD) p.x += offset;
      else p.y += offset;
    }
  }

  const width = PAD * 2 + (isTD ? longest : layerRuns.length * nodeW + (layerRuns.length - 1) * gapX);
  const height = PAD * 2 + (isTD ? layerRuns.length * nodeH + (layerRuns.length - 1) * gapY : longest);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style} onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
      <Svg width={width} height={height}>
        {graph.edges.map((e, i) => {
          const from = pos.get(e.from);
          const to = pos.get(e.to);
          if (!from || !to) return null;
          const x1 = isTD ? from.x + nodeW / 2 : from.x + nodeW;
          const y1 = isTD ? from.y + nodeH : from.y + nodeH / 2;
          const x2 = isTD ? to.x + nodeW / 2 : to.x;
          const y2 = isTD ? to.y : to.y + nodeH / 2;
          const midY = (y1 + y2) / 2;
          const arrowY = y2 - 8;
          const path = isTD
            ? `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${arrowY}`
            : `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2 - 8} ${y2}`;
          return <GLine key={i} e={e} path={path} x2={x2} y2={y2} from={from} to={to} nodeW={nodeW} nodeH={nodeH} isTD={isTD} />;
        })}
        {graph.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          return (
            <G key={n.id}>
              <Rect
                x={p.x}
                y={p.y}
                width={nodeW}
                height={nodeH}
                rx={glassRadius.squircle}
                fill={NODE_FILL}
                stroke={NODE_STROKE}
                strokeWidth={1}
              />
              <SvgText
                x={p.x + nodeW / 2}
                y={p.y + nodeH / 2}
                fontSize={13}
                fontWeight="600"
                fill={theme.light.ink}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {truncateLabel(n.label, nodeW)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

function truncateLabel(label: string, nodeW: number): string {
  const max = Math.floor(nodeW / 7) - 2;
  return label.length > max ? label.slice(0, max - 1) + '…' : label;
}

function GLine({
  e,
  path,
  x2,
  y2,
  from,
  to,
  nodeW,
  nodeH,
  isTD,
}: {
  e: MEdge;
  path: string;
  x2: number;
  y2: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  nodeW: number;
  nodeH: number;
  isTD: boolean;
}) {
  const { theme } = useTheme();
  const label = e.label;
  const midX = (from.x + nodeW + to.x) / 2;
  const arrow = isTD
    ? `M ${x2 - 5} ${y2 - 9} L ${x2} ${y2} L ${x2 + 5} ${y2 - 9}`
    : `M ${x2 - 9} ${y2 - 5} L ${x2} ${y2} L ${x2 - 9} ${y2 + 5}`;
  return (
    <G>
      <Path d={path} fill="none" stroke={ARROW_COLOR} strokeWidth={1.5} strokeDasharray={e.dotted ? '4 4' : undefined} />
      <Path d={arrow} fill="none" stroke={ARROW_COLOR} strokeWidth={1.5} />
      {label ? (
        <SvgText x={midX} y={Math.min(y2 - 6, Math.max(from.y, to.y))} fontSize={10} fill={theme.light.inkMuted} textAnchor="middle">
          {label}
        </SvgText>
      ) : null}
    </G>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  fallback: {
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : '#181425',
    borderRadius: glassRadius.squircle,
    padding: 14,
    marginVertical: 6,
    gap: 6,
  },
  fallbackLabel: {
    color: theme.accents.voice.solid,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  fallbackCode: {
    color: '#F2E9FF',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
