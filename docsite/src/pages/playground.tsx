import type {ReactNode} from 'react';
import {useState, useCallback, useRef, useEffect} from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

import styles from './playground.module.css';

type Preset = {
  readonly name: string;
  readonly expression: string;
  readonly context: string;
  readonly options?: Partial<PlaygroundOptions>;
};

type PlaygroundOptions = {
  readonly enableArrays: boolean;
  readonly enableTemplateStrings: boolean;
  readonly enableArrowFunctions: boolean;
  readonly timeout: number;
  readonly maxComplexity: number;
  readonly maxCallStackDepth: number;
  readonly maxLoopIterations: number;
};

type EvalResult =
  | {readonly type: 'success'; readonly value: string}
  | {readonly type: 'error'; readonly message: string; readonly code?: string}
  | null;

const DEFAULT_OPTIONS: PlaygroundOptions = {
  enableArrays: true,
  enableTemplateStrings: true,
  enableArrowFunctions: true,
  timeout: 1000,
  maxComplexity: 100,
  maxCallStackDepth: 50,
  maxLoopIterations: 10000,
};

const PRESETS: readonly Preset[] = [
  {
    name: 'Basic Arithmetic',
    expression: '2 + 3 * 4',
    context: '{}',
  },
  {
    name: 'Context Variables',
    expression: 'user.age >= 18 ? "Adult" : "Minor"',
    context: '{"user": {"name": "Alice", "age": 25}}',
  },
  {
    name: 'String Functions',
    expression: 'toUpperCase(name)',
    context: '{"name": "hello"}',
  },
  {
    name: 'Array Operations',
    expression: 'sum(numbers) / length(numbers)',
    context: '{"numbers": [10, 20, 30, 40, 50]}',
  },
  {
    name: 'Template Strings',
    expression: '`Hello, ${name}!`',
    context: '{"name": "Alice"}',
    options: {enableTemplateStrings: true},
  },
  {
    name: 'Arrow Functions',
    expression: 'filter(items, x => x > 3)',
    context: '{"items": [1, 2, 3, 4, 5]}',
    options: {enableArrowFunctions: true},
  },
  {
    name: 'Date Functions',
    expression: 'formatDate(dateAdd(now(), 7, "days"), "yyyy-MM-dd")',
    context: '{}',
  },
  {
    name: 'Custom Logic',
    expression: 'if (total > 100) then total * 0.9 else total',
    context: '{"total": 150}',
  },
  {
    name: 'Error Example',
    expression: '1 + / 2',
    context: '{}',
  },
];

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function PlaygroundContent(): ReactNode {
  const [expression, setExpression] = useState(PRESETS[0].expression);
  const [context, setContext] = useState(PRESETS[0].context);
  const [options, setOptions] = useState<PlaygroundOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<EvalResult>(null);
  const [contextError, setContextError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const evaluate = useCallback(
    (expr: string, ctx: string, opts: PlaygroundOptions) => {
      let parsedContext: Record<string, unknown>;
      try {
        parsedContext = JSON.parse(ctx) as Record<string, unknown>;
        setContextError('');
      } catch {
        setContextError('Invalid JSON');
        setResult(null);
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {evaluateExpression} = require('taion-expression');
        const evalResult = evaluateExpression(expr, parsedContext, opts) as {
          readonly success: boolean;
          readonly result?: unknown;
          readonly error?: {
            readonly message?: string;
            readonly code?: string;
          };
          readonly errorCode?: string;
        };

        if (evalResult.success) {
          setResult({type: 'success', value: formatValue(evalResult.result)});
        } else {
          setResult({
            type: 'error',
            message: evalResult.error?.message ?? 'Unknown error',
            code: evalResult.errorCode ?? evalResult.error?.code,
          });
        }
      } catch (e) {
        setResult({
          type: 'error',
          message: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    },
    [],
  );

  const scheduleEvaluation = useCallback(
    (expr: string, ctx: string, opts: PlaygroundOptions) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => evaluate(expr, ctx, opts), 300);
    },
    [evaluate],
  );

  useEffect(() => {
    evaluate(expression, context, options);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpressionChange = (value: string) => {
    setExpression(value);
    scheduleEvaluation(value, context, options);
  };

  const handleContextChange = (value: string) => {
    setContext(value);
    scheduleEvaluation(expression, value, options);
  };

  const handleOptionChange = <K extends keyof PlaygroundOptions>(
    key: K,
    value: PlaygroundOptions[K],
  ) => {
    const newOptions = {...options, [key]: value};
    setOptions(newOptions);
    scheduleEvaluation(expression, context, newOptions);
  };

  const handlePreset = (preset: Preset) => {
    setExpression(preset.expression);
    setContext(preset.context);
    const newOptions = {...DEFAULT_OPTIONS, ...preset.options};
    setOptions(newOptions);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    evaluate(preset.expression, preset.context, newOptions);
  };

  const handleRun = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    evaluate(expression, context, options);
  };

  return (
    <div className={styles.playground}>
      <div className={styles.presets}>
        <span className={styles.presetsLabel}>Examples:</span>
        <div className={styles.presetButtons}>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={styles.presetButton}
              onClick={() => handlePreset(preset)}
              type="button">
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.inputPanel}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.label} htmlFor="expression">
                Expression
              </label>
              <button
                className={styles.runButton}
                onClick={handleRun}
                type="button">
                Run
              </button>
            </div>
            <textarea
              id="expression"
              className={styles.textarea}
              value={expression}
              onChange={(e) => handleExpressionChange(e.target.value)}
              rows={3}
              spellCheck={false}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label} htmlFor="context">
              Context (JSON)
              {contextError && (
                <span className={styles.contextError}> -- {contextError}</span>
              )}
            </label>
            <textarea
              id="context"
              className={styles.textarea}
              value={context}
              onChange={(e) => handleContextChange(e.target.value)}
              rows={4}
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.outputPanel}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.label}>Options</label>
              <button
                className={styles.toggleButton}
                onClick={() => setShowOptions(!showOptions)}
                type="button">
                {showOptions ? 'Hide' : 'Show'}
              </button>
            </div>
            {showOptions && (
              <div className={styles.optionsGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={options.enableArrays}
                    onChange={(e) =>
                      handleOptionChange('enableArrays', e.target.checked)
                    }
                  />
                  Enable Arrays
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={options.enableTemplateStrings}
                    onChange={(e) =>
                      handleOptionChange(
                        'enableTemplateStrings',
                        e.target.checked,
                      )
                    }
                  />
                  Enable Template Strings
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={options.enableArrowFunctions}
                    onChange={(e) =>
                      handleOptionChange(
                        'enableArrowFunctions',
                        e.target.checked,
                      )
                    }
                  />
                  Enable Arrow Functions
                </label>
                <div className={styles.numberOption}>
                  <label htmlFor="timeout">Timeout (ms)</label>
                  <input
                    id="timeout"
                    type="number"
                    className={styles.numberInput}
                    value={options.timeout}
                    onChange={(e) =>
                      handleOptionChange('timeout', Number(e.target.value))
                    }
                    min={100}
                    max={10000}
                  />
                </div>
                <div className={styles.numberOption}>
                  <label htmlFor="maxComplexity">Max Complexity</label>
                  <input
                    id="maxComplexity"
                    type="number"
                    className={styles.numberInput}
                    value={options.maxComplexity}
                    onChange={(e) =>
                      handleOptionChange(
                        'maxComplexity',
                        Number(e.target.value),
                      )
                    }
                    min={10}
                    max={1000}
                  />
                </div>
                <div className={styles.numberOption}>
                  <label htmlFor="maxCallStackDepth">Max Call Stack</label>
                  <input
                    id="maxCallStackDepth"
                    type="number"
                    className={styles.numberInput}
                    value={options.maxCallStackDepth}
                    onChange={(e) =>
                      handleOptionChange(
                        'maxCallStackDepth',
                        Number(e.target.value),
                      )
                    }
                    min={5}
                    max={200}
                  />
                </div>
                <div className={styles.numberOption}>
                  <label htmlFor="maxLoopIterations">Max Iterations</label>
                  <input
                    id="maxLoopIterations"
                    type="number"
                    className={styles.numberInput}
                    value={options.maxLoopIterations}
                    onChange={(e) =>
                      handleOptionChange(
                        'maxLoopIterations',
                        Number(e.target.value),
                      )
                    }
                    min={100}
                    max={100000}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Result</label>
            {result === null ? (
              <div className={styles.resultPlaceholder}>
                Enter an expression to see the result
              </div>
            ) : result.type === 'success' ? (
              <div className={styles.resultSuccess}>
                <pre className={styles.resultPre}>{result.value}</pre>
              </div>
            ) : (
              <div className={styles.resultError}>
                {result.code && (
                  <div className={styles.errorCode}>{result.code}</div>
                )}
                <div className={styles.errorMessage}>{result.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Playground(): ReactNode {
  return (
    <Layout
      title="Playground"
      description="Interactive expression evaluator playground">
      <div className="container margin-vert--lg">
        <h1>Playground</h1>
        <p>
          Try expressions interactively. Edit the expression or context and see
          results update in real time.
        </p>
        <BrowserOnly fallback={<div>Loading playground...</div>}>
          {() => <PlaygroundContent />}
        </BrowserOnly>
      </div>
    </Layout>
  );
}
