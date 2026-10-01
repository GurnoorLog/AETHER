import { texToText } from './latex';

const LIMIT_NAMES: Record<string, string> = {
  lim: 'limit',
  sum: 'sum',
  prod: 'product',
  int: 'integral',
  iint: 'double integral',
  oint: 'contour integral',
};

function speakOperatorBounds(text: string): string {
  text = text.replace(/\\lim\s*_\{([^{}]*)\}/g, (_match, condition: string) => {
    const spoken = condition.replace(/\\to|->/g, ' approaches ');
    return ` limit as ${spoken} `;
  });

  text = text.replace(
    /\\(sum|prod|int|iint|oint)\s*(?:_(\{[^{}]*\}|[^{}\s\\^_]))?\s*(?:\^(\{[^{}]*\}|[^{}\s\\^_]))?/g,
    (_match, operator: string, lowerBound?: string, upperBound?: string) => {
      const name = LIMIT_NAMES[operator] || operator;
      const lower = stripBraces(lowerBound);
      const upper = stripBraces(upperBound);
      if (lower !== undefined && upper !== undefined) {
        return ` ${name} from ${lower} to ${upper} `;
      }
      if (lower !== undefined) return ` ${name} with lower limit ${lower} `;
      if (upper !== undefined) return ` ${name} with upper limit ${upper} `;
      return ` ${name} `;
    },
  );

  return text;
}

function stripBraces(bound?: string): string | undefined {
  if (bound === undefined) return undefined;
  return bound.startsWith('{') && bound.endsWith('}')
    ? bound.slice(1, -1).trim()
    : bound;
}

export function toSpeechText(input: string): string {
  let text = input;
  text = text.replace(/\r/g, '');
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]*)`/g, '$1');
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  text = text.replace(/\$\$([^$]*)\$\$/g, '$1');
  text = text.replace(/\$([^$]*)\$/g, '$1');
  text = text.replace(/\\[,;:!]/g, ' ');
  text = text.replace(/\\(?:quad|qquad)/g, ' ');
  text = speakOperatorBounds(text);
  text = texToText(text);
  text = text.replace(/_/g, ' ');
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
  text = text.replace(/^[ \t]*>[ \t]?/gm, '');
  text = text.replace(/^[ \t]*[-*+][ \t]+/gm, '');
  text = text.replace(/^[ \t]*\d+\.[ \t]+/gm, '');
  text = text.replace(/\*\*(\S(?:[^*]*?\S)?)\*\*/g, '$1');
  text = text.replace(/~~(\S(?:[^~]*?\S)?)~~/g, '$1');
  text = text.replace(/\*\*\s*/g, ' to the power of ');
  text = text.replace(/\*(\S(?:[^*]*?\S)?)\*/g, '$1');
  text = text.replace(/\s\*\s/g, ' times ');
  text = text.replace(/[`#]/g, '');
  text = text.replace(/^[ \t]*\|?[\s:|-]*-[\s:|-]*\|?[ \t]*$/gm, '');
  text = text.replace(/\s*\|\s*/g, ' ');
  text = text.replace(/^[ \t]+$/gm, '');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}
