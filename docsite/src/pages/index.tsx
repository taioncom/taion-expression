import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

const exampleCode = `import { evaluateExpression } from 'taion-expression';

const result = evaluateExpression(
  'user.age >= 18 ? "Welcome" : "Too young"',
  { user: { name: 'Alice', age: 25 } }
);

// result = { success: true, result: 'Welcome' }`;

const exampleExpressions: readonly {
  readonly expression: string;
  readonly result: string;
}[] = [
  { expression: '2 + 3 * 4', result: '14' },
  { expression: 'price * (1 - discount)', result: '90' },
  { expression: 'user.age >= 18 ? "Adult" : "Minor"', result: '"Adult"' },
  { expression: 'toUpperCase("hello world")', result: '"HELLO WORLD"' },
  { expression: 'contains(email, "@")', result: 'true' },
  { expression: 'sum(scores) / length(scores)', result: '85' },
  { expression: 'if (total > 100) then total * 0.9 else total', result: '135' },
  { expression: 'map([1, 2, 3], x => x * 2)', result: '[2, 4, 6]' },
  { expression: 'filter(items, x => x > 3)', result: '[4, 5]' },
  { expression: '`Hello, ${name}!`', result: '"Hello, Alice!"' },
  { expression: 'round(avg([10, 20, 33]))', result: '21' },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <img
          src={useBaseUrl('/img/logo.svg')}
          alt="Taion Expression logo"
          className={styles.heroLogo}
        />
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started"
          >
            Get Started
          </Link>
          <Link
            className="button button--secondary button--outline button--lg"
            to="/playground"
          >
            Try the Playground
          </Link>
        </div>
        <p className="margin-top--md">
          <Link to="/docs/llms">Documentation for AI coding agents</Link>
        </p>
      </div>
    </header>
  );
}

function HomepageExpressions() {
  return (
    <section className={styles.expressions}>
      <div className="container">
        <Heading as="h2" className="text--center margin-bottom--lg">
          What can you evaluate?
        </Heading>
        <div className={clsx('col col--8 col--offset-2')}>
          <table className={styles.expressionTable}>
            <thead>
              <tr>
                <th>Expression</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {exampleExpressions.map((ex, idx) => (
                <tr key={idx}>
                  <td>
                    <code>{ex.expression}</code>
                  </td>
                  <td>
                    <code>{ex.result}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function HomepageExample() {
  return (
    <section className={styles.example}>
      <div className="container">
        <div className="row">
          <div className={clsx('col col--8 col--offset-2')}>
            <CodeBlock language="typescript" title="Quick Example">
              {exampleCode}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout description="A safe, sandboxed expression language for evaluating untrusted user input">
      <HomepageHeader />
      <main>
        <HomepageExpressions />
        <HomepageExample />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
