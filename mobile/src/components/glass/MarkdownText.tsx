import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { MermaidFlow } from './MermaidFlow';
import { MathBlock } from './MathBlock';

/**
 * Minimal markdown renderer for AI chat responses — the mobile mirror of the
 * web chat's renderMarkdown. No dependencies: hand-rolled tokenizer covering
 * the blocks Aether actually emits (headings, lists, quotes, fenced code,
 * bold/italic/inline code) rendered with the light glass text scale.
 */

type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'mermaid'; text: string }
  | { kind: 'math'; text: string };

const INLINE = /(\$\$?[^$]+\$?\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function inlineNodes(text: string, keyBase: string, styles: ReturnType<typeof makeStyles>): ReactNode[] {
  const nodes = text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const isDisplay = part.startsWith('$$');
      const body = part.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1);
      return (
        <Text key={`${keyBase}-m${i}`} style={[styles.mathInline, isDisplay && styles.mathInlineDisplay]}>
          {body}
        </Text>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={`${keyBase}-b${i}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text key={`${keyBase}-c${i}`} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={`${keyBase}-i${i}`} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={`${keyBase}-t${i}`}>{part}</Text>;
  });
  return nodes;
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      const isMermaid = (fence[1] || '').toLowerCase() === 'mermaid';
      blocks.push({ kind: isMermaid ? 'mermaid' : 'code', text: buf.join('\n') });
      continue;
    }

    // Display math: a $$...$$ line or a $$...$$ block spanning lines.
    const mathMatch = line.match(/^\s*\$\$(.*?)\$\$\s*$/) || line.match(/^\s*\$\$\s*$/);
    if (mathMatch) {
      if (mathMatch[1] !== undefined) {
        blocks.push({ kind: 'math', text: mathMatch[1].trim() });
        i++;
        continue;
      }
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].includes('$$')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ kind: 'math', text: buf.join(' ').trim() });
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.*)/);
    if (heading) {
      blocks.push({ kind: 'h', level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    // Quote
    const quote = line.match(/^>\s?(.*)/);
    if (quote) {
      blocks.push({ kind: 'quote', text: quote[1] });
      i++;
      continue;
    }

    // Bullet / numbered list
    const listLine = line.match(/^[-*]\s+(.*)/) || line.match(/^\d+\.\s+(.*)/);
    if (listLine) {
      const ordered = /^\d+\./.test(line);
      const items: string[] = [listLine[1]];
      i++;
      while (i < lines.length) {
        const next = lines[i].match(/^[-*]\s+(.*)/) || lines[i].match(/^\d+\.\s+(.*)/);
        if (!next) break;
        items.push(next[1]);
        i++;
      }
      blocks.push(ordered ? { kind: 'ol', items } : { kind: 'ul', items });
      continue;
    }

    // Paragraph: fold consecutive non-empty text lines into one flow.
    if (line.trim()) {
      const buf: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(```|#{1,4}\s|>|[-*]\s|\d+\.\s)/.test(lines[i])
      ) {
        buf.push(lines[i].trim());
        i++;
      }
      blocks.push({ kind: 'p', text: buf.join(' ') });
      continue;
    }
    i++;
  }
  return blocks;
}

interface MarkdownTextProps {
  content: string;
  /** Text color for body copy (e.g. theme.light.inkSoft on glass). */
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function MarkdownText({ content, color, style }: MarkdownTextProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const textColor = color ?? theme.light.inkSoft;
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <View style={style}>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        switch (b.kind) {
          case 'h':
            return (
              <Text
                key={key}
                style={[
                  styles.heading,
                  b.level === 1
                    ? styles.h1
                    : b.level === 2
                      ? styles.h2
                      : styles.h3,
                  { color: textColor },
                ]}
              >
                {inlineNodes(b.text, key, styles)}
              </Text>
            );
          case 'p':
            return (
              <Text key={key} style={[styles.paragraph, { color: textColor }]}>
                {inlineNodes(b.text, key, styles)}
              </Text>
            );
          case 'ul':
            return (
              <View key={key} style={styles.list}>
                {b.items.map((item, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>•</Text>
                    <Text style={[styles.listItem, { color: textColor }]}>{inlineNodes(item, `${key}-${j}`, styles)}</Text>
                  </View>
                ))}
              </View>
            );
          case 'ol':
            return (
              <View key={key} style={styles.list}>
                {b.items.map((item, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>{j + 1}.</Text>
                    <Text style={[styles.listItem, { color: textColor }]}>{inlineNodes(item, `${key}-${j}`, styles)}</Text>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return (
              <View key={key} style={styles.quote}>
                <Text style={[styles.quoteText, { color: textColor }]}>{inlineNodes(b.text, key, styles)}</Text>
              </View>
            );
          case 'code':
            return (
              <View key={key} style={styles.codeBlock}>
                <Text style={styles.codeText}>{b.text}</Text>
              </View>
            );
          case 'mermaid':
            return <MermaidFlow key={key} chart={b.text} />;
          case 'math':
            return <MathBlock key={key} tex={b.text} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  paragraph: { fontSize: 15, lineHeight: 23, marginVertical: 3 },
  bold: { fontWeight: '700', color: theme.light.ink },
  italic: { fontStyle: 'italic' },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: theme.light.ink,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(24,20,37,0.07)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  mathInline: { fontFamily: 'monospace', fontStyle: 'italic', color: theme.light.ink },
  mathInlineDisplay: { fontSize: 16 },
  heading: { fontWeight: '700', lineHeight: 26, marginTop: 8, marginBottom: 4 },
  h1: { fontSize: 18 },
  h2: { fontSize: 16 },
  h3: { fontSize: 15 },
  list: { gap: 4, marginVertical: 4 },
  listRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 15, lineHeight: 23, width: 18, fontWeight: '700' },
  listItem: { fontSize: 15, lineHeight: 23, flex: 1 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: theme.dark ? 'rgba(255,255,255,0.2)' : 'rgba(24,20,37,0.15)',
    paddingLeft: spacing.md,
    marginVertical: 4,
  },
  quoteText: { fontStyle: 'italic', fontSize: 14, lineHeight: 21 },
  codeBlock: {
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : '#181425',
    borderRadius: glassRadius.squircle,
    padding: spacing.lg,
    marginVertical: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
    color: '#F2E9FF',
  },
});
