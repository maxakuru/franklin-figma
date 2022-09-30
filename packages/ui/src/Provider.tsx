import React, { useEffect, useState } from "react"
import { RootStoreProvider } from "./state/provider"
import { AnyOk } from "./types";
import {
  defaultTheme,
  Provider as SpectrumProvider,
} from '@adobe/react-spectrum';

class ErrorBoundary extends React.Component<AnyOk> {
  constructor(props: AnyOk) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: AnyOk) {
    console.log('[ErrorBoundary] getDerivedStateFromError()', error);
  }

  componentDidCatch(error: AnyOk, errorInfo: AnyOk) {
    console.log('[ErrorBoundary] componentDidCatch()', error, errorInfo);
    // TODO: report error back to plugin backend
  }

  render() {
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

export default ({
  children
}: { children: React.ReactElement }) => {
  const [theme, setTheme] = useState<'dark'|'light'>('light');
  useEffect(() => {
    if(document.documentElement.classList.contains('figma-dark')) {
      setTheme('dark');
    }
  }, []);
  return (
    <ErrorBoundary>
      <RootStoreProvider>
        <SpectrumProvider theme={defaultTheme} scale='medium' colorScheme={theme}>
          {children}
        </SpectrumProvider>
      </RootStoreProvider>
    </ErrorBoundary>
  );
}