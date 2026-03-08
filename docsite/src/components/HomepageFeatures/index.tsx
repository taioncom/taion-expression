import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Safe & Sandboxed',
    description: (
      <>
        Evaluate untrusted user expressions without risk. Built-in timeout
        control, call stack limits, complexity checks, and prototype pollution
        prevention keep your application secure.
      </>
    ),
  },
  {
    title: 'Expressive Language',
    description: (
      <>
        Arithmetic, comparison, and logical operators. Conditionals, arrays,
        template strings, arrow functions, and a large set of built-in functions
        for strings, math, arrays, objects, and type checking.
      </>
    ),
  },
  {
    title: 'TypeScript First',
    description: (
      <>
        Full type definitions with discriminated union result types. Dual
        CJS/ESM package support. Zero runtime dependencies.
      </>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
