'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const VISITOR_ID_STORAGE_KEY = 'smp-visitor-id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getVisitorId() {
  try {
    const storedId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (storedId && UUID_PATTERN.test(storedId)) return storedId;

    const visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    return visitorId;
  } catch (error) {
    console.error('Failed to persist the public visitor ID:', error);
    return null;
  }
}

function isLocalHostname(hostname: string) {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname) || hostname.endsWith('.localhost');
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const pendingEvent = useRef<{ path: string; id: string; visitorId: string } | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/admin') || isLocalHostname(window.location.hostname)) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    if (!pendingEvent.current || pendingEvent.current.path !== pathname || pendingEvent.current.visitorId !== visitorId) {
      pendingEvent.current = { path: pathname, id: window.crypto.randomUUID(), visitorId };
    }

    const event = pendingEvent.current;
    const recordVisitor = async () => {
      try {
        const { error } = await supabase.rpc('record_site_pageview', {
          p_event_id: event.id,
          p_path: event.path,
          p_visitor_id: event.visitorId,
        });
        if (error) {
          console.error('Failed to record the unique public visitor:', error);
          return;
        }
        if (pendingEvent.current?.id === event.id) pendingEvent.current = null;
      } catch (error) {
        console.error('Unexpected error while recording the unique public visitor:', error);
      }
    };
    void recordVisitor();
  }, [pathname]);

  return null;
}
