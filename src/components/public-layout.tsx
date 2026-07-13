'use client';

import { useState } from 'react';
import RadialNav from '@/components/RadialNav';
import { Nav } from '@/components/nav';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SCHOOL_NAV_TREE } from '@/components/RadialNav.example';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [tartaOpen, setTartaOpen] = useState(false);
  const toggleTarta = () => setTartaOpen((o) => !o);

  return (
    <>
      <Nav tartaOpen={tartaOpen} onTartaToggle={toggleTarta} />
      <Breadcrumbs />
      <div className="hidden md:block">
        <RadialNav
          tree={SCHOOL_NAV_TREE}
          isOpen={tartaOpen}
          onClose={() => setTartaOpen(false)}
          defaultColor="#3a7d44"
        />
      </div>
      <main className="flex-1">{children}</main>
    </>
  );
}
