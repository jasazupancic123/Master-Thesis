declare module '*.svg' {
  import type * as React from 'react';
  const ReactComponent: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
  >;

  export default ReactComponent;
}
