import { useState, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';

/**
 * StrictMode safe DND wrapper
 * Fixes droppable registry crash in React StrictMode
 */
export function StrictModeDroppable({ children, ...props }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
}
