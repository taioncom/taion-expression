import { evaluateExpression } from '../build/module/index.js';

const result = evaluateExpression('3 * 4');
if (result.success !== true || result.result !== 12) {
  console.error('Smoke test failed for ESM build', result);
  process.exit(1);
}

console.log('Smoke test passed for ESM build');
