# Calculator: exact arithmetic from a TV remote

TimeBoxed App 01 — **Make every minute count.**

The calculator replaces the placeholder with a four-column keypad, a large result,
previous expression, and a separate CE control. The persistent six-icon rail stays
outside the keypad. D-pad moves between keys; Select activates them; Back returns
to the dashboard. The initial key is 5.

## Technical decisions

- `src/calculator/engine.ts` is a pure reducer and explicit precedence evaluator.
  Multiplication/division are evaluated before addition/subtraction; there is no
  `eval`, parser package, network request or dependency addition.
- Decimal inputs become reduced BigInt fractions. Thus 0.1 + 0.2 is exactly 0.3,
  and a displayed rounded 1/3 multiplied by 3 is still exactly 1.
- Results show up to 12 significant digits, with scientific notation for large or
  very small values. `≈` identifies rounded display values; calculation continues
  with the exact fraction. Entries accept up to 18 digits, expressions up to 127
  tokens, and rational components are bounded to 256 characters.
- Percent always divides the current entry/result by 100. Consequently
  `200 + 10%` is 200.1; this is not a commercial-calculator contextual percentage.
- AC resets everything. CE clears the entry while keeping a pending expression.
  Backspace edits the current entry, removes a pending operator, or clears a
  completed result. Equals on an already completed result is a no-op. A digit
  after a result starts a fresh calculation; an operator continues from it.
- The small external store retains calculator state while navigating, matching
  the existing in-process store pattern. A force-stop/restart starts a new
  calculation; calculator history is not written to disk.

## Code to discuss

```ts
const divisor = gcd(n < 0n ? -n : n, d);
n /= divisor;
d /= divisor;
```

```ts
if (op === '*' || op === '/') product = operate(product, op, next.value);
else {
  total = operate(total, add, product);
  product = next.value;
  add = op;
}
```

The repository's current engine is the source of truth; these are short excerpts.

## Problems solved

Floating-point display noise was avoided by exact rational arithmetic rather than
rounding intermediate Number values. Formatting reports approximation explicitly.
A native TV keypad test also checks 2 + 2 = 4, then continuing + 3 = 7, and result
recovery after navigating away and back. Native Hermes executes the BigInt engine
in that test, in addition to Node's pure-engine coverage.

The placeholder rail previously claimed preferred focus on Calculator. During
this phase, a temporary shared Screen option limited that preference to the
remaining placeholders; the real Calculator gives preferred focus to its keypad.
The final World Clocks phase removed that option and the last placeholder screen.
The TV test script runs
files serially because parallel test files would send competing remote inputs to
one emulator. The harness retries a missing accessibility root/focus once without
sending recovery input. It uses two real rail neighbours to wake a focused item
instead of assuming Right cannot leave the rail, and Clock scenarios have a
fresh launcher baseline while a separate test retains cross-utility Timer coverage.

Long runs on the installed emulator exposed exit code 139, invalid colour-buffer
errors and stalled QEMU threads. A runtime-only launch was tried with
`-gpu swiftshader -feature -Vulkan`; app configuration, package versions and the
AVD data partition were preserved. Validation outcomes are recorded separately,
so an emulator disconnect is not presented as an application test pass.
See [Android graphics acceleration documentation](https://developer.android.com/studio/run/emulator-acceleration).

## Evidence

- Screenshot: [Calculator at 1920 × 1080](../../artifacts/utilities/calculator.png).
- Demonstration video: [Remote calculation](../../artifacts/utilities/calculator-demo.mp4).
- Unit coverage: `tests/calculator.test.ts` (arithmetic, precedence, decimals,
  negative values, percent, errors, clear/edit operations, exact continuation,
  large-number bounds).
- Native acceptance: `tests/tv/calculator.test.ts`.

Phase validation: ESLint, strict TypeScript, all 35 unit tests and Android export
passed. The full native run had 18 passing results and two failures after an ADB
hierarchy timeout. Both remaining checks (cross-utility Timer state and bright/dark
fixtures) passed when rerun independently. All checks therefore passed across
these runs; the uninterrupted full run did not pass. Native video and screenshot
were captured from the 1920 × 1080 Android TV emulator.

After all three utilities were integrated, the final combined run passed all 48
unit tests and all 22 TV results, plus lint, strict TypeScript and Android export.
See the [delivery report](../utilities-delivery.md) for the final record.
