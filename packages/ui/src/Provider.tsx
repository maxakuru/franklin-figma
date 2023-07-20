import type { VNode } from 'preact';
import { PureComponent } from 'preact/compat';
import { useEffect } from "preact/hooks"
import { RootStoreProvider, useRootStore } from "./state/provider"
import { AnyOk } from "./types";
import {
  defaultTheme,
  Provider as SpectrumProvider,
} from '@adobe/react-spectrum';

class ErrorBoundary extends PureComponent<AnyOk> {
  constructor(props: AnyOk) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: AnyOk) {
    console.log('[ErrorBoundary] getDerivedStateFromError()', error);
    return error;

  }

  componentDidCatch(error: AnyOk, errorInfo: AnyOk) {
    console.log('[ErrorBoundary] componentDidCatch()', error, errorInfo, this.state, this.props);
    // TODO: report error back to plugin backend
  }

  render() {
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

const ThemeProvider = ({
  children
}: { children: VNode }) => {
  const store = useRootStore();
  useEffect(() => {
    if(document.documentElement.classList.contains('figma-dark')) {
      store.setTheme('dark');
    }
  }, []);

  return <SpectrumProvider theme={defaultTheme} scale='medium' colorScheme={store.theme}>
    {children}
  </SpectrumProvider>;
}

export default ({
  children
}: { children: VNode }) => {
  return (
    <ErrorBoundary>
      <RootStoreProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </RootStoreProvider>
    </ErrorBoundary>
  );
}