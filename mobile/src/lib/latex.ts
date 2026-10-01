const GREEK: Record<string, string> = {
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η',
  Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν', Xi: 'Ξ',
  Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ', Upsilon: 'Υ', Phi: 'Φ',
  Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ϵ',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ',
  rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ',
  phi: 'φ', varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
};

const SYMBOL: Record<string, string> = {
  times: '×', div: '÷', cdot: '·', pm: '±', mp: '∓', ast: '∗',
  approx: '≈', neq: '≠', ne: '≠', equiv: '≡', leq: '≤', le: '≤', geq: '≥', ge: '≥',
  ll: '≪', gg: '≫', sim: '∼', simeq: '≃', propto: '∝',
  rightarrow: '→', to: '→', longrightarrow: '⟶', leftarrow: '←',
  leftrightarrow: '↔', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
  uparrow: '↑', downarrow: '↓', mapsto: '↦',
  int: '∫', iint: '∬', oint: '∮', sum: '∑', prod: '∏', infty: '∞',
  partial: '∂', nabla: '∇', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
  therefore: '∴', because: '∵', degree: '°', circ: '∘', perp: '⊥', parallel: '∥',
  angle: '∠', ldots: '…', cdots: '⋯', dots: '…', vdots: '⋮', ddots: '⋱', prime: '′',
  in: '∈', notin: '∉', subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇',
  cup: '∪', cap: '∩', emptyset: '∅', varnothing: '∅',
  lvert: '|', rvert: '|', vert: '|', mid: '|', lVert: '‖', rVert: '‖',
  langle: '⟨', rangle: '⟩',
};

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇',
  '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', o: 'ₒ', x: 'ₓ', h: 'ₕ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ',
  p: 'ₚ', s: 'ₛ', t: 'ₜ', u: 'ᵤ',
};

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷',
  '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
};

const NAMES = new Set([...Object.keys(GREEK), ...Object.keys(SYMBOL)]);

const UNWRAP =
  /\\(?:text|textrm|textnormal|textup|mathrm|mathbf|mathit|mathsf|mathtt|operatorname|mbox|hbox|displaystyle|textstyle|scriptstyle)\s*\{([^{}]*)\}/g;

function scriptify(value: string, map: Record<string, string>): string | null {
  let out = '';
  for (const ch of value) {
    const mapped = map[ch];
    if (!mapped) return null;
    out += mapped;
  }
  return out;
}

/**
 * Best-effort conversion of LaTeX fragments to readable Unicode so raw
 * LaTeX that appears outside $...$ delimiters still renders cleanly.
 */
export function texToText(input: string): string {
  let s = input;

  s = s.replace(/\\([()[\]])/g, '');

  s = s.replace(/\|\s*(?=(?:\\)?([A-Za-z]+))/g, (match, name) => (NAMES.has(name) ? '' : match));

  s = s.replace(UNWRAP, '$1');
  s = s.replace(UNWRAP, '$1');

  s = s.replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2');
  s = s.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, (_match, n, r) => {
    const sup = scriptify(n, SUPERSCRIPT) ?? n;
    return `${sup}√(${r})`;
  });
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');

  s = s.replace(/\\(?:vec|overrightarrow)\s*\{([^{}]*)\}/g, '$1\u20D7');
  s = s.replace(/\\bar\s*\{([^{}]*)\}/g, '$1\u0304');
  s = s.replace(/\\hat\s*\{([^{}]*)\}/g, '$1\u0302');
  s = s.replace(/\\dot\s*\{([^{}]*)\}/g, '$1\u0307');

  s = s.replace(/\\(?:left|right|big|Big|bigg|Bigg)\s*/g, '');

  s = s.replace(/\\([A-Za-z]+)/g, (match, name) => GREEK[name] ?? SYMBOL[name] ?? name);

  s = s.replace(/_\{([^{}]*)\}/g, (match, x) => scriptify(x, SUBSCRIPT) ?? `_${x}`);
  s = s.replace(/\^\{([^{}]*)\}/g, (match, x) => scriptify(x, SUPERSCRIPT) ?? `^${x}`);
  s = s.replace(/\^([A-Za-z0-9])/g, (match, x) => scriptify(x, SUPERSCRIPT) ?? match);

  s = s.replace(/[{}]/g, '');
  s = s.replace(/[ \t]{2,}/g, ' ');

  return s;
}
