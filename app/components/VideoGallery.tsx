'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getYouTubeVideoId } from '@/lib/youtube';

type VideoItem = {
  id: string;
  title: string;
  media_url: string;
  thumbnailUrl?: string;
};

const FEATURED_VIDEOS: VideoItem[] = [
  { id: 'IGIRUAZDsfU', title: 'Sudah pernah dengar kisah teladan Nabi yang berjudul "8 Dirham"?', media_url: 'https://youtu.be/IGIRUAZDsfU', thumbnailUrl: 'https://i.ytimg.com/vi/IGIRUAZDsfU/maxresdefault.jpg' },
  { id: '-2Cz46PrI_A', title: 'Episode 1 KURMA - 4 Golongan orang yang dirindukan surga', media_url: 'https://youtu.be/-2Cz46PrI_A' },
  { id: '3qodDL0ZOLk', title: 'Pembelajaran Ber-KSE Mapel IPA kelas IX', media_url: 'https://youtu.be/3qodDL0ZOLk' },
  { id: '3jS7Ga8sFaw', title: 'Upacara Bendera memperingati HUT Kemerdekaan ke 79 Republik Indonesia pada 17 Agustus 2024 di Kramat', media_url: 'https://youtu.be/3jS7Ga8sFaw' },
  { id: 'xeZaLKuB4KM', title: 'MPLS Hari Pertama SMP Muhammadiyah Kembaran, 22 Juli 2024', media_url: 'https://youtu.be/xeZaLKuB4KM' },
  { id: 'FlM_T4AXImI', title: 'Perpisahan SMP Muhammadiyah Kembaran tahun ajaran 2023-2024', media_url: 'https://youtu.be/FlM_T4AXImI' },
  { id: 'WYBQg19s8Cg', title: 'Program P5 SMP Muhammadiyah Kembaran Tahun 2023-2024', media_url: 'https://youtu.be/WYBQg19s8Cg' },
  { id: 'N4pLawDWr3c', title: 'Pesantren Kilat Ramadhan... Benar atau salah materi Sholat Idul Fitri -ist', media_url: 'https://youtu.be/N4pLawDWr3c' },
  { id: 'qMp9bcRC3Gc', title: 'Apel Pagi di SMP MUHAMMADIYAH KEMBARAN oleh Kapolsek Kembaran', media_url: 'https://youtu.be/qMp9bcRC3Gc' },
];

const YOUTUBE_VIDEOS_URL = 'https://www.youtube.com/@smpmuhkembaran/videos';

export default function VideoGallery() {
  const { t } = useLang();
  const [videos, setVideos] = useState<VideoItem[]>(FEATURED_VIDEOS);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from('school_gallery_items')
      .select('id,title,media_url')
      .eq('media_type', 'video')
      .order('sort_order')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load managed school videos:', error);
          if (active) setLoadError(true);
        } else if (active) {
          const managedVideos = data || [];
          const seenVideoIds = new Set<string>();
          const uniqueManagedVideos = managedVideos.filter((video) => {
            const videoId = getYouTubeVideoId(video.media_url);
            if (!videoId || seenVideoIds.has(videoId)) return false;
            seenVideoIds.add(videoId);
            return true;
          });
          setVideos(uniqueManagedVideos);
          setLoadError(false);
        }
      });
    return () => { active = false; };
  }, []);

  const playableVideos = videos.flatMap((video) => {
    const videoId = getYouTubeVideoId(video.media_url);
    return videoId ? [{ ...video, videoId }] : [];
  });

  return (
    <>
      {loadError && (
        <p role="status" className="mb-6 rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
          {t('Video tambahan dari admin belum dapat dimuat. Video unggulan tetap tersedia.', 'Additional admin videos could not be loaded. Featured videos are still available.')}
        </p>
      )}

      {playableVideos.length > 0 && (
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {playableVideos.map((video) => (
            <article key={video.videoId} className="min-w-0 overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <a
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('Tonton video', 'Watch video')}: ${video.title}`}
                className="group relative block aspect-video overflow-hidden bg-slate-200 dark:bg-slate-900"
              >
                <img
                  src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-slate-950/10 transition-colors group-hover:bg-slate-950/25">
                  <span className="flex h-12 w-16 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg transition-transform group-hover:scale-105">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                </span>
              </a>
              <h3 className="break-words p-4 text-sm font-bold leading-6 text-slate-900 dark:text-white">{video.title}</h3>
            </article>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          {t(
            playableVideos.length
              ? 'Lihat video lainnya melalui kanal YouTube resmi SMP Muhammadiyah Kembaran.'
              : 'Video dapat ditonton melalui kanal YouTube resmi SMP Muhammadiyah Kembaran.',
            playableVideos.length
              ? 'Find more videos on the official SMP Muhammadiyah Kembaran YouTube channel.'
              : 'Watch videos on the official SMP Muhammadiyah Kembaran YouTube channel.',
          )}
        </p>
        <a
          href={YOUTUBE_VIDEOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-sky-700 dark:bg-white dark:text-slate-950 dark:hover:bg-sky-200"
        >
          {t('Buka Kanal YouTube', 'Open YouTube Channel')}
        </a>
      </div>
    </>
  );
}
