export type AchievementCardProps = {
  imageUrl: string | null;
  imageAlt: string;
  badge: string;
  title: string;
  event: string;
  participant?: string;
  detail?: string;
};

export default function AchievementCard({
  imageUrl,
  imageAlt,
  badge,
  title,
  event,
  participant,
  detail,
}: AchievementCardProps) {
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden border border-white/70 bg-white/45 p-2 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition-colors duration-300 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.09]">
      <div className="aspect-[4/5] w-full overflow-hidden bg-slate-200/30 dark:bg-slate-900/50">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">
            {badge}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="w-fit border border-white/70 bg-white/60 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
          {badge}
        </span>
        <h2 className="text-sm font-black leading-snug text-slate-950 dark:text-white">{title}</h2>
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{event}</p>
        {participant && (
          <p className="mt-auto text-xs font-semibold text-slate-700 dark:text-slate-200">
            {participant}
          </p>
        )}
        {detail && (
          <p className="border-t border-slate-200/70 pt-2 text-[11px] leading-4 text-slate-500 dark:border-white/10 dark:text-slate-400">
            {detail}
          </p>
        )}
      </div>
    </article>
  );
}
