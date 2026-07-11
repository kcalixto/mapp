export type Site = {
  slug: string
  url: string
  title: string
}

// O cover de cada site é servido de /public/<slug>.jpg
export const sites: Site[] = [
  {
    slug: 'bilhete-unico-app',
    url: 'https://example.com',
    title: 'Bilhete Único',
  },
  {
    slug: 'exemplo-site',
    url: 'https://example.org',
    title: 'Exemplo',
  },
]
