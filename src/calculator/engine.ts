export type Rational = { n: bigint; d: bigint };
type Operator = '+' | '-' | '*' | '/';
type Value = { value: Rational; source: string | null };
type Token = Value | Operator;
export type CalculatorState = {
  tokens: readonly Token[]; entry: string | null; result: Rational | null;
  history: string; error: string | null;
};
export type CalculatorKey = string;
const ZERO: Rational = { n: 0n, d: 1n };
const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const isOperator = (value: unknown): value is Operator => typeof value === 'string' && Object.hasOwn(symbols, value);
function gcd(a: bigint, b: bigint): bigint { while (b) { const rest = a % b; a = b; b = rest; } return a || 1n; }
function rational(n: bigint, d: bigint): Rational {
  if (!d) throw new Error('Cannot divide by zero.');
  if (d < 0n) { n = -n; d = -d; }
  const divisor = gcd(n < 0n ? -n : n, d); n /= divisor; d /= divisor;
  if (n.toString().length > 256 || d.toString().length > 256) throw new Error('Number is too large.');
  return { n, d };
}
export function parseDecimal(text: string): Rational {
  if (!/^-?\d+(\.\d*)?$/.test(text) || text.length > 256) throw new Error('Enter a valid number.');
  const [whole, fraction = ''] = text.split('.');
  return rational(BigInt(`${whole}${fraction}`), 10n ** BigInt(fraction.length));
}
function operate(a: Rational, op: Operator, b: Rational): Rational {
  switch (op) {
    case '+': return rational(a.n * b.d + b.n * a.d, a.d * b.d);
    case '-': return rational(a.n * b.d - b.n * a.d, a.d * b.d);
    case '*': return rational(a.n * b.n, a.d * b.d);
    case '/': return rational(a.n * b.d, a.d * b.n);
  }
}
export function evaluateTokens(tokens: readonly Token[]): Rational {
  if (!tokens.length || tokens.length % 2 === 0 || typeof tokens[0] === 'string') throw new Error('Complete the expression.');
  let product = tokens[0].value;
  let total = ZERO;
  let add: Operator = '+';
  for (let index = 1; index < tokens.length; index += 2) {
    const op = tokens[index]; const next = tokens[index + 1];
    if (!isOperator(op) || !next || typeof next === 'string') throw new Error('Complete the expression.');
    if (op === '*' || op === '/') product = operate(product, op, next.value);
    else { total = operate(total, add, product); product = next.value; add = op; }
  }
  return operate(total, add, product);
}
export function formatRational(value: Rational): { text: string; rounded: boolean } {
  if (!value.n) return { text: '0', rounded: false };
  const sign = value.n < 0n ? '−' : '';
  const n = value.n < 0n ? -value.n : value.n;
  let exponent = n.toString().length - value.d.toString().length;
  const compare = exponent >= 0 ? n >= value.d * 10n ** BigInt(exponent) : n * 10n ** BigInt(-exponent) >= value.d;
  if (!compare) exponent--;
  const scale = 11 - exponent;
  const scaledN = scale >= 0 ? n * 10n ** BigInt(scale) : n;
  const scaledD = scale >= 0 ? value.d : value.d * 10n ** BigInt(-scale);
  const remainder = scaledN % scaledD;
  let digits = (scaledN / scaledD + (remainder * 2n >= scaledD ? 1n : 0n)).toString();
  if (digits.length > 12) { digits = digits.slice(0, -1); exponent++; }
  digits = digits.padStart(12, '0');
  let text: string;
  if (exponent >= 12 || exponent <= -7) {
    const fraction = digits.slice(1).replace(/0+$/, '');
    text = `${digits[0]}${fraction ? `.${fraction}` : ''}e${exponent >= 0 ? '+' : ''}${exponent}`;
  } else {
    const point = exponent + 1;
    text = point <= 0 ? `0.${'0'.repeat(-point)}${digits}`
      : point >= digits.length ? digits + '0'.repeat(point - digits.length) : `${digits.slice(0, point)}.${digits.slice(point)}`;
    if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');
  }
  return { text: sign + text, rounded: remainder !== 0n };
}
function finiteDecimal(value: Rational): string {
  const sign = value.n < 0n ? '-' : '';
  const n = value.n < 0n ? -value.n : value.n;
  let fraction = ''; let remainder = n % value.d;
  for (let index = 0; remainder && index < 256; index++) {
    remainder *= 10n; fraction += String(remainder / value.d); remainder %= value.d;
  }
  if (remainder) throw new Error('Clear the entry before editing this result.');
  return `${sign}${n / value.d}${fraction ? `.${fraction}` : ''}`;
}
export const createCalculator = (): CalculatorState => ({ tokens: [], entry: '0', result: null, history: '', error: null });
function expression(tokens: readonly Token[]): string {
  return tokens.map((token) => typeof token === 'string' ? symbols[token] : formatRational(token.value).text).join(' ');
}
export function calculatorDisplay(state: CalculatorState) {
  const previous = state.tokens.at(-1);
  const value = state.result ?? (state.entry === null && previous && typeof previous !== 'string' ? previous.value : null);
  const formatted = value ? formatRational(value) : null;
  // While waiting for an operand, show the operand immediately before its operator.
  const waiting = state.entry === null && !state.result ? state.tokens.at(-2) : null;
  const fallback = waiting && typeof waiting !== 'string' ? formatRational(waiting.value) : null;
  return {
    value: state.error ?? (formatted ? `${formatted.rounded ? '≈ ' : ''}${formatted.text}` : state.entry?.replace('-', '−')
      ?? (fallback ? `${fallback.rounded ? '≈ ' : ''}${fallback.text}` : '0')),
    expression: state.history || `${expression(state.tokens)}${state.entry !== null && state.tokens.length ? ` ${state.entry.replace('-', '−')}` : ''}`,
  };
}
export function calculatorReducer(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (key === 'AC') return createCalculator();
  if (key === 'CE') return { ...state, entry: '0', result: null, history: '', error: null };
  try {
    if (/^\d$/.test(key) || key === '.') {
      const base = state.error || state.result ? createCalculator() : state;
      const entry = base.entry ?? '0';
      if (key === '.' && entry.includes('.')) return base;
      if (key !== '.' && entry.replace(/[-.]/g, '').length >= 18) return base;
      const next = key === '.' ? `${entry}.` : entry === '0' ? key : entry === '-0' ? `-${key}` : entry + key;
      return { ...base, entry: next, history: '', error: null };
    }
    if (state.error) return state;
    if (key === '⌫') {
      if (state.result) return createCalculator();
      if (state.entry !== null) {
        const entry = state.entry.slice(0, -1);
        return { ...state, entry: entry && entry !== '-' ? entry : '0' };
      }
      const last = state.tokens.at(-2);
      if (last && typeof last !== 'string') return { ...state, tokens: state.tokens.slice(0, -2), entry: last.source,
        result: last.source === null ? last.value : null };
      return createCalculator();
    }
    if (key === '±' || key === '%') {
      if (state.result) {
        const value = state.result;
        return { ...state, result: key === '±' ? rational(-value.n, value.d) : rational(value.n, value.d * 100n),
          history: key === '%' ? `${formatRational(value).text}%` : `−(${formatRational(value).text})` };
      }
      const entry = state.entry ?? '0';
      return { ...state, entry: key === '±' ? (entry.startsWith('-') ? entry.slice(1) : `-${entry}`)
        : finiteDecimal(operate(parseDecimal(entry), '/', { n: 100n, d: 1n })) };
    }
    if (isOperator(key)) {
      if (state.tokens.length >= 127) throw new Error('Expression is too long.');
      if (state.result) return { ...createCalculator(), tokens: [{ value: state.result, source: null }, key], entry: null };
      if (state.entry === null) return { ...state, tokens: [...state.tokens.slice(0, -1), key] };
      return { ...state, tokens: [...state.tokens, { value: parseDecimal(state.entry), source: state.entry }, key], entry: null };
    }
    if (key === '=') {
      if (state.result) return state;
      if (state.entry === null) throw new Error('Complete the expression.');
      const tokens = [...state.tokens, { value: parseDecimal(state.entry), source: state.entry }];
      return { tokens: [], entry: null, result: evaluateTokens(tokens), history: `${expression(tokens)} =`, error: null };
    }
    return state;
  } catch (error) {
    return { ...state, error: error instanceof Error ? error.message : 'Cannot calculate this expression.' };
  }
}
