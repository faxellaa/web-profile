export function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      return null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const id = url.searchParams.get('v')
      || (['embed', 'shorts', 'live'].includes(parts[0] || '') ? parts[1] : null);
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
