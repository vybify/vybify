import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const _require = createRequire(import.meta.url);
let _wasmInit: Promise<void> | null = null;
function ensureWasm() {
  if (!_wasmInit) {
    const pkgDir = dirname(_require.resolve('@resvg/resvg-wasm'));
    _wasmInit = initWasm(readFileSync(join(pkgDir, 'index_bg.wasm')));
  }
  return _wasmInit;
}

const INTER_400 = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff';
const INTER_600 = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff';

const fontCache = new Map<string, ArrayBuffer>();

async function fetchFont(url: string): Promise<ArrayBuffer> {
  if (fontCache.has(url)) return fontCache.get(url)!;
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  fontCache.set(url, buf);
  return buf;
}

export interface OgOptions {
  name: string;
  tagline: string;
  type: string;
  stars: number | null;
  author?: string;
  tags?: string[];
}

export async function generateOgImage(opts: OgOptions): Promise<Buffer> {
  await ensureWasm();
  const [regular, semibold] = await Promise.all([
    fetchFont(INTER_400),
    fetchFont(INTER_600),
  ]);

  const { name, tagline, type, stars, author, tags = [] } = opts;
  const starsLabel =
    stars != null
      ? stars >= 1000
        ? `${(stars / 1000).toFixed(1)}k ★`
        : `${stars} ★`
      : null;
  const topTags = tags.slice(0, 3);
  const truncatedTagline = tagline.length > 120 ? tagline.slice(0, 117) + '...' : tagline;
  const fontSize = name.length > 32 ? '48px' : '62px';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '64px',
          backgroundColor: '#0f1117',
          fontFamily: 'Inter',
        },
        children: [
          // Badge row
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' },
              children: [
                {
                  type: 'span',
                  props: {
                    style: {
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#1f6fff',
                      backgroundColor: 'rgba(31,111,255,0.12)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    },
                    children: type,
                  },
                },
                ...(starsLabel
                  ? [
                      {
                        type: 'span',
                        props: {
                          style: { fontSize: '14px', color: '#5f6877' },
                          children: starsLabel,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          // Name
          {
            type: 'div',
            props: {
              style: {
                fontSize,
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '18px',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
              },
              children: name,
            },
          },
          // Tagline
          {
            type: 'div',
            props: {
              style: {
                fontSize: '22px',
                color: '#8b94a3',
                lineHeight: '1.5',
                flex: '1',
                maxWidth: '820px',
              },
              children: truncatedTagline,
            },
          },
          // Bottom row
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: '48px',
              },
              children: [
                // Left: author + tags
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '10px' },
                    children: [
                      ...(author
                        ? [
                            {
                              type: 'span',
                              props: {
                                style: { fontSize: '15px', color: '#5f6877' },
                                children: `by ${author}`,
                              },
                            },
                          ]
                        : []),
                      ...(topTags.length > 0
                        ? [
                            {
                              type: 'div',
                              props: {
                                style: { display: 'flex', gap: '8px' },
                                children: topTags.map((tag) => ({
                                  type: 'span',
                                  props: {
                                    style: {
                                      fontSize: '13px',
                                      color: '#5f6877',
                                      backgroundColor: '#1a1d23',
                                      padding: '4px 10px',
                                      borderRadius: '100px',
                                      border: '1px solid #2e3540',
                                    },
                                    children: `#${tag}`,
                                  },
                                })),
                              },
                            },
                          ]
                        : []),
                    ],
                  },
                },
                // Right: vybify brand
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: '10px' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: '#1f6fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                          children: {
                            type: 'span',
                            props: {
                              style: { color: '#fff', fontSize: '17px', fontWeight: 700 },
                              children: 'v',
                            },
                          },
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: { color: '#ffffff', fontSize: '20px', fontWeight: 600 },
                          children: 'vybify',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: semibold, weight: 600, style: 'normal' },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return Buffer.from(resvg.render().asPng());
}
