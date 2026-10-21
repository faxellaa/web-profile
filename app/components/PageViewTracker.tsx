'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PageViewTracker() {
  const pathname = usePathname();
  const pendingEvent = useRef<{ path: string; id: string } | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    if (!pendingEvent.current || pendingEvent.current.path !== pathname) {
      pendingEvent.current = { path: pathname, id: crypto.randomUUID() };
    }

    const event = pendingEvent.current;
    supabase.rpc('record_site_pageview', { p_event_id: event.id, p_path: event.path }).then(({ error }) => {
      if (!error && pendingEvent.current?.id === event.id) pendingEvent.current = null;
    });
  }, [pathname]);

  return null;
}
