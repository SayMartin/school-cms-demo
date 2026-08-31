// app/layout.tsx  (or wherever you mount global nav)
// ─────────────────────────────────────────────────────────────────────────────
// Example: wiring RadialNav into your Next.js app
// ─────────────────────────────────────────────────────────────────────────────

import RadialNav, { RadialNavNode } from '@/components/RadialNav';

// ── Colour palette ────────────────────────────────────────────────────────────
// Pastel rainbow: pink · peach · yellow · green · blue
// `light` is a ~50% tint toward white — distinct but still soft.
// `dark` is a medium tone readable on the pastel, not too deep.
// Children within each sub-wheel cycle through the same five colours.
const P = [
  { color: '#ffb3ba', dark: '#8c1a30', light: '#ffd9dd' }, // 0 pink
  { color: '#ffdfba', dark: '#8c4a00', light: '#ffeedd' }, // 1 peach
  { color: '#ffffba', dark: '#5c5c00', light: '#ffffdd' }, // 2 yellow
  { color: '#baffc9', dark: '#135430', light: '#ddffe4' }, // 3 green
  { color: '#bae1ff', dark: '#0f3d84', light: '#ddf0ff' }, // 4 blue
  { color: '#CBCBFF', dark: '#3a3a8c', light: '#e8e8ff' }, // 5 purple
] as const;

// ── Navigation tree ──────────────────────────────────────────────────────────
// Rules:
//   • Nodes with `children` → spawn a sub-wheel on click
//   • Leaf nodes with `href`  → router.push(href)
//   • Leaf nodes with neither → fires the root onSelect callback

export const SCHOOL_NAV_TREE: RadialNavNode[] = [
  {
    id: 'education-programs',
    label: 'Education Programs',
    ...P[3],
    overviewHref: '/education-programs',
    children: [
      { id: 'allman',   label: 'General Course',             ...P[0], href: '/education-programs/allman-kurs' },
      { id: 'konst',    label: 'Art School',                  ...P[1], href: '/education-programs/art-school' },
      { id: 'akademi',  label: 'Academy 55+',                 ...P[2], href: '/education-programs/akademi-55-plus' },
      { id: 'halso',    label: 'Health Coach',                ...P[3], href: '/education-programs/halsocoachutbildning' },
      { id: 'naturliv', label: 'Nature & Life',               ...P[4], href: '/education-programs/nature-life-courses' },
      { id: 'elev',     label: 'Student & Teacher Assistant', ...P[0], href: '/distance-education/elev-och-lararassistent' },
    ],
  },
  {
    id: 'short-courses',
    label: 'Short Courses',
    ...P[1],
    overviewHref: '/short-courses',
    children: [
      { id: 'summer-courses-child', label: 'Summer Courses', ...P[2], href: '/summer-courses' },
      { id: 'evening-courses',      label: 'Evening Courses', ...P[0], href: '/evening-courses' },
      { id: 'mhfa',                 label: 'MHFA',            ...P[3], href: '/mental-health-first-aid' },
      { id: 'smf',                  label: 'SMF',             ...P[4], href: '/study-motivation-course' },
    ],
  },
  {
    id: 'summer-courses-root',
    label: 'Summer Courses',
    ...P[2],
    overviewHref: '/summer-courses',
    children: [
      { id: 'summer-courses-practical-info', label: 'Practical Info', ...P[1], href: '/summer-courses-practical-info' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    ...P[5],
    overviewHref: '/about',
    children: [
      { id: 'about-page',          label: 'Association',        ...P[0], href: '/about/association' },
      { id: 'history',             label: 'History',             ...P[1], href: '/about/history' },
      { id: 'news',                label: 'News',                 ...P[2], href: '/news' },
      { id: 'careers',             label: 'Open Positions',      ...P[3], href: '/about/careers' },
      { id: 'apply',               label: 'Application',         ...P[4], href: '/about/apply' },
      { id: 'study-guidance',      label: 'Study Guidance',      ...P[0], href: '/about/study-guidance' },
      { id: 'student-support',     label: 'Student Support',     ...P[1], href: '/about/student-support' },
      { id: 'student-rights',      label: 'Student Rights',      ...P[2], href: '/about/student-rights' },
      { id: 'term-dates',          label: 'Term Dates',          ...P[3], href: '/about/term-dates' },
      { id: 'report-issue',        label: 'Report an Issue',     ...P[4], href: '/about/report-issue' },
      { id: 'participant-stories', label: 'Participant Stories', ...P[0], href: '/participant-stories' },
      { id: 'boarding',            label: 'Boarding',            ...P[1], href: '/boarding' },
      { id: 'venues',              label: 'Venues',              ...P[2], href: '/venues' },
    ],
  },
  {
    id: 'folk-education',
    label: 'Folk Education',
    ...P[2],
    href: '/folk-education',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    ...P[0],
    href: '/restaurant',
  },
  {
    id: 'contact',
    label: 'Contact',
    ...P[4],
    href: '/contact',
  },
];

// ── Layout usage ─────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RadialNav
          tree={SCHOOL_NAV_TREE}
          isOpen={true}
          onClose={() => {}}
          defaultColor="#1f5a78"
          onSelect={(node) => {
            console.log('Selected:', node.id);
          }}
        />
        {children}
      </body>
    </html>
  );
}
