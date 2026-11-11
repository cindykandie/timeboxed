import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatorDisplay, calculatorReducer, createCalculator, formatRational, parseDecimal } from '../src/calculator/engine.ts';

const enter = (keys: string[]) => keys.reduce(calculatorReducer, createCalculator());
const display = (keys: string[]) => calculatorDisplay(enter(keys)).value;
test('calculator supports arithmetic and standard precedence without eval', () => {
  for (const [keys, expected] of [
    [['2', '+', '2', '='], '4'], [['1', '0', '-', '3', '='], '7'],
    [['5', '*', '6', '='], '30'], [['2', '0', '/', '4', '='], '5'],
    [['2', '+', '3', '*', '4', '='], '14'], [['2', '0', '/', '4', '*', '2', '-', '3', '='], '7'],
  ] as const) assert.equal(display([...keys]), expected);
});
test('decimal arithmetic is exact, repeated dots are ignored, and negative entries/sign changes work', () => {
  assert.equal(display(['0', '.', '1', '+', '0', '.', '2', '=']), '0.3');
  assert.equal(display(['1', '.', '.', '2', '+', '±', '3', '=']), '−1.8');
  assert.equal(display(['5', '±', '*', '2', '=']), '−10');
  assert.equal(display(['5', '=', '±']), '−5');
});
test('percent is current value divided by 100; it also works with a result', () => {
  assert.equal(display(['5', '0', '%']), '0.5');
  assert.equal(display(['2', '0', '0', '+', '1', '0', '%', '=']), '200.1');
  assert.equal(display(['5', '0', '=', '%', '*', '2', '=']), '1');
});
test('display rounding is marked and does not alter the exact value used in consecutive calculations', () => {
  const result = enter(['1', '/', '3', '=']);
  assert.equal(calculatorDisplay(result).value, '≈ 0.333333333333');
  assert.deepEqual(result.result, { n: 1n, d: 3n });
  const continued = ['*', '3', '='].reduce(calculatorReducer, result);
  assert.equal(calculatorDisplay(continued).value, '1');
  assert.equal(display(['2', '+', '2', '=', '+', '3', '=']), '7');
  assert.equal(display(['2', '+', '2', '=', '8']), '8');
});
test('AC, CE, backspace and replacing an operator preserve valid editing state', () => {
  assert.equal(display(['1', '2', '3', '⌫']), '12');
  assert.equal(display(['2', '+', '9', 'CE', '3', '=']), '5');
  assert.equal(display(['2', '+', '9', 'AC']), '0');
  assert.equal(display(['2', '+', '*', '3', '=']), '6');
  assert.equal(display(['2', '+', '⌫']), '2');
  assert.equal(display(['1', '/', '3', '=', '+', '⌫', '*', '3', '=']), '1');
});
test('division by zero, incomplete expressions and malformed input are safe and recoverable', () => {
  assert.equal(display(['1', '/', '0', '=']), 'Cannot divide by zero.');
  assert.equal(display(['1', '/', '0', '=', '7']), '7');
  assert.equal(display(['2', '+', '=']), 'Complete the expression.');
  assert.equal(display(['toString', 'not-a-key']), '0');
  assert.throws(() => parseDecimal('1.2.3'), /valid number/);
});
test('large/small values use sensible scientific notation and computations are bounded', () => {
  assert.deepEqual(formatRational(parseDecimal('1000000000000')), { text: '1e+12', rounded: false });
  assert.deepEqual(formatRational(parseDecimal('0.00000001')), { text: '1e-8', rounded: false });
  const long = enter(Array(25).fill('9'));
  assert.equal(long.entry?.length, 18);
  let state = enter(['9', '=']);
  for (let i = 0; i < 300 && !state.error; i++) state = ['*', '9', '='].reduce(calculatorReducer, state);
  assert.equal(state.error, 'Number is too large.');
});
