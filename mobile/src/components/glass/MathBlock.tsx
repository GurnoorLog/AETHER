import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Renders a `$$...$$` LaTeX block via katex in a WebView — the mobile mirror of
 * the web chat's katex.renderToString. Isolated from the glass world so a math
 * block never breaks layout or causes native renderer churn.
 * ponytail: one WebView per display-math block; add a pooled renderer if a
 * session ever shows many equations at once.
 */

interface MathBlockProps {
  tex: string;
  textColor?: string;
}

const FALLBACK_BG = 'rgba(255,255,255,0.72)';

export function MathBlock({ tex, textColor = '#1a1722' }: MathBlockProps) {
  const html = useMemo(() => {
    const escaped = tex.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          html, body { margin:0; padding:0; background:transparent; }
          .wrap { display:flex; justify-content:center; padding:10px 0; color:${textColor}; }
          .katex { font-size: 1.08em; }
        </style>
      </head><body>
        <div class="wrap" id="root"></div>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <script>
          try {
            var el = document.getElementById('root');
            el.innerHTML = katex.renderToString('${escaped}', {
              displayMode: true, throwOnError: false, output: 'html'
            });
          } catch (e) { document.body.innerText = e.message; }
        </script>
      </body></html>`;
  }, [tex, textColor]);

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={styles.web}
      containerStyle={styles.container}
      androidLayerType="none"
      setSupportMultipleWindows={false}
      overScrollMode="never"
      bounces={false}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      textInteractionEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    backgroundColor: FALLBACK_BG,
    overflow: 'hidden',
    marginVertical: 6,
  },
  web: { backgroundColor: FALLBACK_BG },
});
