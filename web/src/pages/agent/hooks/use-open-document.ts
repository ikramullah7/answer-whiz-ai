import { useCallback } from 'react';

export function useOpenDocument() {
  const openDocument = useCallback(() => {
    window.open('/help.html', '_blank');
  }, []);

  return openDocument;
}
