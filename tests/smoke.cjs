const { evaluateExpression } = require('../build/main/index.js');

const result = evaluateExpression('1 + 2');
if (result.success !== true || result.result !== 3) {
  console.error('Smoke test failed for CommonJS build', result);
  process.exit(1);
}

console.log('Smoke test passed for CommonJS build');
