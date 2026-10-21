update public.school_stats
set headmaster_name = 'Isti Awalia, S.Pd., M.Pd., Gr.',
    updated_at = now()
where headmaster_name is distinct from 'Isti Awalia, S.Pd., M.Pd., Gr.';