import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saisha Bloom',
    short_name: 'Saisha Bloom',
    description: 'A calm, private way to notice your child’s growing story.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f6f0',
    theme_color: '#173d45',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
      { src: '/icons/icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
