delete from public.school_gallery_items
where media_type = 'photo'
  and media_url in (
    '/img/bahan/IMG_0667.jpeg',
    '/img/bahan/IMG_0687.jpeg'
  );
