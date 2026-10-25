"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { DOSSIER_ITEMS, type DossierItem } from '../data/ledgerData';
import { DossierModal } from '../components/pinboard/DossierModal';
import { DispatchMemoModal } from '../components/pinboard/DispatchMemoModal';
import { PdfIntelligenceWorkbench } from '../components/pinboard/PdfIntelligenceWorkbench';
import { ProjectPrototypeModal, type ProjectPrototypeId } from '../components/pinboard/ProjectPrototypeModal';

const downloadProjectZip = () => {
  const link = document.createElement('a');
  link.href = '/downloads/pragatheesh-portfolio.zip';
  link.download = 'pragatheesh-portfolio.zip';
  link.click();
};

const profile = {
  name: 'Pragatheesh',
  title: 'Azure Data & AI Engineer',
  email: 'pragatheshpragathesh@gmail.com',
  phone: '7598914366',
  location: 'Bengaluru, Karnataka, India',
  linkedin: 'https://www.linkedin.com/in/pragathees-r',
  portfolio: 'https://pragatheeshuidev.github.io/profile.html',
};

type SectionCategory =
  | 'all'
  | 'about'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certificates'
  | 'contact';

const NAV_SECTIONS: { id: Exclude<SectionCategory, 'all'>; num: string; label: string; cursor: string }[] = [
  { id: 'about', num: '01', label: 'About', cursor: '01' },
  { id: 'experience', num: '02', label: 'Experience', cursor: '02' },
  { id: 'projects', num: '03', label: 'Projects', cursor: '03' },
  { id: 'education', num: '04', label: 'Education', cursor: '04' },
  { id: 'certificates', num: '05', label: 'Certificates', cursor: '05' },
  { id: 'contact', num: '06', label: 'Contact', cursor: '06' },
];

const FILTER_BUTTONS: { cat: SectionCategory; label: string; cursor: string }[] = [
  { cat: 'all', label: 'All Pins', cursor: 'ALL' },
  { cat: 'about', label: '01 About', cursor: '01' },
  { cat: 'experience', label: '02 Experience', cursor: '02' },
  { cat: 'projects', label: '03 Projects', cursor: '03' },
  { cat: 'education', label: '04 Education', cursor: '04' },
  { cat: 'certificates', label: '05 Certifications', cursor: '05' },
  { cat: 'contact', label: '06 Dispatch', cursor: '06' },
];

const FEATURED_PROJECTS = [
  { id: 'groundtruth', figure: '4A', label: 'DOCUMENTATION Q&A', status: 'LOCAL DEMO', accent: 'pin-violet', tags: ['Cited answers', 'Can abstain', '5 fixture pages'], description: 'Ask a question about documentation and get a cited answer, or see when the available sources are not enough.' },
  { id: 'steadyagent', figure: '4B', label: 'SAFE TASK RUNNER', status: 'LOCAL DEMO', accent: 'pin-brass', tags: ['Calculator', 'Notes search', 'Action trace'], description: 'Try a calculation or search. The demo shows which approved tool ran and what it returned.' },
  { id: 'tokensense', figure: '4C', label: 'MODEL GATEWAY', status: 'LOCAL DEMO', accent: 'pin-red', tags: ['No key needed', 'Cache status', 'Usage details'], description: 'Send a test prompt through a local gateway and inspect its route, cache status, and token usage.' },
  { id: 'smallwins', figure: '4D', label: 'MODEL COMPARISON', status: 'LOCAL DEMO', accent: 'pin-obsidian', tags: ['3 sample questions', 'Accuracy + speed', 'Run summary'], description: 'Run the same sample questions against a simple baseline and review its accuracy, speed, and cost.' },
] as const;

const isProjectPrototypeId = (id: string): id is ProjectPrototypeId =>
  id === 'groundtruth' || id === 'steadyagent' || id === 'tokensense' || id === 'smallwins';

type UploadedProject = {
  id: string;
  name: string;
  previewUrl: string;
  fileName: string;
};

function ProjectPreview({ projectId }: { projectId: ProjectPrototypeId }) {
  if (projectId === 'groundtruth') {
    return (
      <div className="aspect-[16/10] rounded-lg border border-[#cad9ce] bg-[#edf3ee] p-3 text-[#243c30] sm:p-4">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider"><span>Question</span><span className="text-emerald-800">Evidence linked</span></div>
        <p className="mt-2 text-sm font-medium">What does len return?</p>
        <div className="mt-4 border-l-2 border-emerald-700 pl-3">
          <p className="text-xs leading-relaxed">Returns the length of an object.</p>
          <p className="mt-2 font-mono text-[9px] text-emerald-900">SOURCE // len · PYTHON DOCS</p>
        </div>
      </div>
    );
  }

  if (projectId === 'steadyagent') {
    return (
      <div className="aspect-[16/10] rounded-lg border border-[#e3d7bc] bg-[#f5f0e5] p-3 text-[#473a25] sm:p-4">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider"><span>Task trace</span><span className="text-emerald-800">Complete</span></div>
        <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded border border-[#dfd2b4] bg-white/75 p-3">
          <span className="font-mono text-xs text-[#9a6b1e]">01</span><span className="text-sm font-medium">Calculate invoice total</span><span className="font-mono text-xs">59.85</span>
        </div>
        <p className="mt-3 font-mono text-[9px] text-[#746547]">ALLOWLISTED TOOL · 1 STEP · 1 ATTEMPT</p>
      </div>
    );
  }

  if (projectId === 'tokensense') {
    return (
      <div className="aspect-[16/10] rounded-lg border border-[#36534a] bg-[#1e302b] p-3 text-[#e4f2e9] sm:p-4">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider"><span>Request route</span><span className="text-[#a7d8b8]">Local mode</span></div>
        <p className="mt-3 rounded bg-white/10 p-2.5 text-xs">Explain what makes an answer grounded.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase text-[#bfdbca]"><span>Budget check</span><span>→</span><span>Model route</span><span>→</span><span>Response</span></div>
      </div>
    );
  }

  return (
    <div className="aspect-[16/10] rounded-lg border border-[#e1cdbd] bg-[#f5ece5] p-3 text-[#49352b] sm:p-4">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider"><span>Sample benchmark</span><span className="text-[#8a472c]">3 cases</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-[#e1cdbd] bg-white/75 p-2"><span className="block font-mono text-[9px] uppercase">Exact</span><span className="mt-1 block text-lg font-semibold">100%</span></div>
        <div className="rounded border border-[#e1cdbd] bg-white/75 p-2"><span className="block font-mono text-[9px] uppercase">F1</span><span className="mt-1 block text-lg font-semibold">100%</span></div>
        <div className="rounded border border-[#e1cdbd] bg-white/75 p-2"><span className="block font-mono text-[9px] uppercase">Cost</span><span className="mt-1 block text-lg font-semibold">$0</span></div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<SectionCategory>('all');
  const [activeNavSection, setActiveNavSection] = useState<string>('about');
  const [headerCopied, setHeaderCopied] = useState(false);
  const [dispatchCopied, setDispatchCopied] = useState(false);
  const [zipDownloaded, setZipDownloaded] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierItem | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchSubject, setDispatchSubject] = useState<string | undefined>(undefined);
  const [uploadedProjects, setUploadedProjects] = useState<UploadedProject[]>([]);
  const [isPdfProjectOpen, setIsPdfProjectOpen] = useState(false);
  const [activePrototype, setActivePrototype] = useState<ProjectPrototypeId | null>(null);
  const projectUploadRef = useRef<HTMLInputElement>(null);

  const handleDownloadZip = () => {
    downloadProjectZip();
    setZipDownloaded(true);
    setTimeout(() => setZipDownloaded(false), 2500);
  };

  // Custom Cursor Refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorBadgeRef = useRef<HTMLSpanElement>(null);

  // Scroll Spy for Header Navigation Tabs
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ['about', 'experience', 'projects', 'education', 'certificates', 'contact'];
      let current = 'about';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetParent !== null) {
          const top = el.offsetTop - 140;
          if (window.scrollY >= top) {
            current = id;
          }
        }
      }
      setActiveNavSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeFilter]);

  // High-End Interactive Cursor & Click Spark Effect
  useEffect(() => {
    const cursorEl = cursorRef.current;
    const badgeEl = cursorBadgeRef.current;
    if (
      !cursorEl ||
      !window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        'a, button, [data-cursor], .pin-item'
      ) as HTMLElement | null;
      if (target) {
        cursorEl.classList.add('cursor-hover-active');
        const tag = target.getAttribute('data-cursor') || 'VIEW';
        if (badgeEl) badgeEl.textContent = tag;
      } else {
        cursorEl.classList.remove('cursor-hover-active');
      }
    };

    const handleClick = (e: MouseEvent) => {
      const spark = document.createElement('div');
      spark.className = 'cursor-click-spark';
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 550);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const handleCopyHeaderEmail = () => {
    navigator.clipboard.writeText(profile.email).then(() => {
      setHeaderCopied(true);
      setTimeout(() => setHeaderCopied(false), 2000);
    });
  };

  const handleCopyDispatchEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(profile.email).then(() => {
      setDispatchCopied(true);
      setTimeout(() => setDispatchCopied(false), 2400);
    });
  };

  const handleNavigateSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: Exclude<SectionCategory, 'all'>) => {
    e.preventDefault();
    if (activeFilter !== 'all' && activeFilter !== sectionId) {
      setActiveFilter('all');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveNavSection(sectionId);
  };

  const openDossier = (id: string) => {
    const item = DOSSIER_ITEMS[id];
    if (item) setSelectedDossier(item);
  };

  const openProjectPrototype = (id: ProjectPrototypeId) => {
    setSelectedDossier(null);
    setActivePrototype(id);
  };

  const openDispatchModal = (subject?: string) => {
    setDispatchSubject(subject);
    setIsDispatchModalOpen(true);
  };

  const handleProjectUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const newProjects = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
    }));

    setUploadedProjects((projects) => [...projects, ...newProjects]);
    event.target.value = '';
  };

  const removeUploadedProject = (id: string) => {
    setUploadedProjects((projects) => {
      const project = projects.find((item) => item.id === id);
      if (project) URL.revokeObjectURL(project.previewUrl);
      return projects.filter((item) => item.id !== id);
    });
  };

  const isSectionVisible = (cat: Exclude<SectionCategory, 'all'>) =>
    activeFilter === 'all' || activeFilter === cat;

  return (
    <div className="min-h-screen relative">
      {/* Interactive Cursor Markup */}
      <div id="custom-cursor" ref={cursorRef}>
        <div id="cursor-ring">
          <span id="cursor-badge" ref={cursorBadgeRef}>
            INSPECT
          </span>
        </div>
        <div id="cursor-dot"></div>
      </div>

      {/* =============================================================== */}
      {/* ATMOSPHERIC BACKGROUND CANVAS WITH ATELIER LIGHT & PARTICLES    */}
      {/* =============================================================== */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Breathing atelier daylight gradient */}
        <div className="absolute -top-32 -right-32 w-[42rem] h-[42rem] rounded-full bg-secondary-fixed/30 blur-[110px] animate-ambient-breathe"></div>
        <div
          className="absolute top-1/3 -left-40 w-[36rem] h-[36rem] rounded-full bg-tertiary-fixed/25 blur-[120px] animate-ambient-breathe"
          style={{ animationDelay: '-5s' }}
        ></div>
        <div
          className="absolute bottom-20 right-1/4 w-[38rem] h-[38rem] rounded-full bg-[#f1ebe0]/70 blur-[90px] animate-ambient-breathe"
          style={{ animationDelay: '-9s' }}
        ></div>

        {/* Drifting Archival Glimmer Dust Particles */}
        <div
          className="glimmer-dot w-2 h-2 top-[18%] left-[12%]"
          style={{ '--dur': '13s', '--delay': '0s' } as React.CSSProperties}
        ></div>
        <div
          className="glimmer-dot w-3 h-3 top-[34%] right-[15%]"
          style={{ '--dur': '16s', '--delay': '2.5s' } as React.CSSProperties}
        ></div>
        <div
          className="glimmer-dot w-1.5 h-1.5 top-[62%] left-[28%]"
          style={{ '--dur': '11s', '--delay': '4.8s' } as React.CSSProperties}
        ></div>
        <div
          className="glimmer-dot w-2.5 h-2.5 top-[78%] right-[30%]"
          style={{ '--dur': '14s', '--delay': '1.2s' } as React.CSSProperties}
        ></div>
        <div
          className="glimmer-dot w-2 h-2 top-[48%] left-[75%]"
          style={{ '--dur': '18s', '--delay': '6s' } as React.CSSProperties}
        ></div>
        <div
          className="glimmer-dot w-1.5 h-1.5 top-[88%] left-[8%]"
          style={{ '--dur': '12s', '--delay': '3.1s' } as React.CSSProperties}
        ></div>

        {/* Editorial Registration Watermarks & Edge Millimeter Rulers */}
        <div className="absolute top-24 left-3 reg-mark flex flex-col gap-1 items-center">
          <span>000</span>
          <span className="h-6 w-[1px] bg-outline-variant/60"></span>
          <span>050</span>
          <span className="h-6 w-[1px] bg-outline-variant/60"></span>
          <span>100</span>
          <span className="h-6 w-[1px] bg-outline-variant/60"></span>
          <span>150</span>
          <span className="h-6 w-[1px] bg-outline-variant/60"></span>
          <span className="writing-vertical -rotate-90 origin-center text-[8px] mt-2">
            CALIBRATED RULER // MM
          </span>
        </div>
        <div className="absolute top-28 right-4 reg-mark flex flex-col items-end gap-1">
          <span>⌖ {profile.location}</span>
          <span>⊕ IST (UTC+5:30)</span>
          <span>⊞ PROFILE: REF: AZ-DATA-AI-2025</span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* FIXED HEADER                                                    */}
      {/* =============================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/92 backdrop-blur-md border-b border-surface-container-high shadow-[0_4px_20px_rgba(45,36,28,0.04)]">
        <div className="h-20 w-full px-margin-sm lg:px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-md">
            <a
              className="px-space-sm py-space-xs bg-surface-container-low border border-surface-container-high rounded-lg shadow-sm flex items-center gap-space-xs transition-transform hover:-translate-y-0.5"
              data-cursor="ABOUT"
              href="#about"
              onClick={(e) => handleNavigateSection(e, 'about')}
            >
              <span className="pushpin-3d pin-violet !static !w-4 !h-4 !shadow-none shrink-0"></span>
              <span className="font-label-md text-label-md uppercase text-on-surface tracking-wider font-semibold">
                {profile.name} {'//'} {profile.title}
              </span>
            </a>
            <div className="hidden 2xl:flex items-center px-space-sm py-space-xs bg-surface-container-high rounded shadow-[0_1px_2px_rgba(45,36,28,0.04)] rotate-[-0.5deg]">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>{' '}
                PORTFOLIO // DATA &amp; AI ENGINEERING
              </span>
            </div>
          </div>

          {/* 6 Pinned Sections Direct Navigation */}
          <nav
            className="hidden lg:flex items-center p-1 bg-surface-container-low border border-surface-container-high rounded-full shadow-[inset_0_1px_2px_rgba(28,24,23,0.04)]"
            id="navTabs"
          >
            {NAV_SECTIONS.map((sec) => {
              const isActive = activeNavSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  data-cursor={sec.cursor}
                  onClick={(e) => handleNavigateSection(e, sec.id)}
                  className={`nav-tab px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider transition-all rounded-full flex items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="text-[10px] opacity-70">{sec.num}</span>
                  <span>{sec.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={handleDownloadZip}
                data-cursor="ZIP"
                className={`h-9 px-3 border rounded shadow-sm transition-all font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                  zipDownloaded
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-secondary-fixed text-on-secondary-fixed border-secondary/30 hover:bg-secondary hover:text-on-secondary'
                }`}
                title="Download Complete Project ZIP Archive"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {zipDownloaded ? 'check_circle' : 'folder_zip'}
                </span>{' '}
                <span>{zipDownloaded ? 'ZIP Saved ✓' : 'Download ZIP'}</span>
              </button>
              <button
                type="button"
                onClick={() => openDispatchModal()}
                data-cursor="MEMO"
                className="hidden sm:flex h-9 px-3 bg-surface-container-lowest border border-surface-container-high text-on-surface rounded shadow-sm hover:bg-surface-container transition-all font-label-md text-label-md uppercase tracking-wider items-center gap-1.5 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">mail</span>{' '}
                Dispatch Memo
              </button>
              <button
                type="button"
                onClick={handleCopyHeaderEmail}
                data-cursor="COPY"
                className="hidden sm:flex h-9 px-3 bg-primary text-on-primary rounded shadow-sm hover:bg-[#222] transition-all font-label-md text-label-md uppercase tracking-wider items-center gap-1.5 active:scale-95 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span className="btn-copy-label">
                  {headerCopied ? 'Copied! ✓' : 'Copy Email'}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => openDossier('manifesto-01')}
              data-cursor="DOSSIER"
              className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-mono text-xs font-bold shadow-inner ring-2 ring-surface-container-high hover:scale-105 transition-transform"
              title={`${profile.name} Profile Dossier`}
            >
              P
            </button>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 min-h-screen relative z-10">
        <div className="relative w-full px-margin-sm lg:px-margin py-space-xl flex flex-col gap-24">
          {/* Top Hero Banner with Filter Pills */}
          <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container pb-space-lg relative">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container-high border border-outline-variant/60 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest rounded shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> TACTILE
                  SYSTEMS LEDGER // PROFILE
                </span>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                {profile.location}
                </span>
                <span className="distressed-stamp !text-[9px] !py-0.5 !px-2 border-emerald-700 text-emerald-800 bg-emerald-50">
                  PROFILE DETAILS
                </span>
              </div>
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-none">
                Pragatheesh | Azure Data &amp; AI Engineer
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                A personal portfolio for Pragatheesh, focused on data engineering, applied AI,
                and thoughtful systems.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-surface-container-low border border-surface-container-high rounded-full shadow-sm">
              {FILTER_BUTTONS.map((btn) => {
                const isSelected = activeFilter === btn.cat;
                return (
                  <button
                    key={btn.cat}
                    type="button"
                    data-category={btn.cat}
                    data-cursor={btn.cursor}
                    onClick={() => setActiveFilter(btn.cat)}
                    className={`board-filter-btn px-3 py-1 font-label-sm text-label-sm uppercase tracking-wider rounded-full transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 01: ABOUT ME & MANIFESTO (#about)                       */}
          {/* =============================================================== */}
          {isSectionVisible('about') && (
            <section
              className="portfolio-section flex flex-col gap-space-lg scroll-mt-28 relative"
              data-section-cat="about"
              id="about"
            >
              {/* Registration watermark */}
              <div className="absolute -top-5 right-2 reg-mark pointer-events-none">
                REG // 0x4F9B — DECK 01
              </div>
              {/* Bookmark Index Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-widest rounded-t shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">person</span> SECTION 01
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    About Me &amp; Engineering Manifesto
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="distressed-stamp distressed-stamp-violet !text-[9px] !py-0.5">
                    PROFILE DETAILS
                  </span>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                    INDEX: REF_ARCH_01
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                {/* Manifesto Paper Card (7 cols) */}
                <div
                  onClick={() => openDossier('manifesto-01')}
                  className="lg:col-span-7 pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="EXPAND"
                >
                  {/* Washi Tape */}
                  <div className="washi-tape -top-3 left-12 w-36 h-6 -rotate-2">
                    <span className="font-mono text-[8px] text-outline tracking-widest uppercase flex items-center justify-center h-full">
                      LEDGER ARCHIVE // NOTE
                    </span>
                  </div>
                  {/* 3D Pushpin Top Right */}
                  <div className="pushpin-3d pin-violet top-2 right-4"></div>
                  <div className="deckled-card p-space-lg rounded-xl rotate-[-0.6deg] flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm uppercase tracking-widest rounded font-mono">
                        PIN #01 // PHILOSOPHY NOTE
                      </span>
                      <span className="font-mono text-[10px] text-outline">AZURE DATA &amp; AI PROFILE</span>
                    </div>
                    <div className="flex flex-col gap-space-xs">
                      <span className="font-label-sm text-label-sm uppercase text-outline tracking-widest font-mono">
                        [ PRAGATHEESH // ENGINEERING PROFILE ]
                      </span>
                      <p className="font-headline-lg text-headline-lg text-on-surface leading-snug">
                Azure Data &amp; AI Engineer | Ex-Cognizant | Ex-BYJU’S
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant pt-1 leading-relaxed">
                        I’m Pragatheesh, an Azure Data &amp; AI Engineer focused on end-to-end cloud data
                        solutions. My experience spans Microsoft Fabric, Azure Data Factory, Lakehouse
                        architectures, Azure AI, OpenAI, and RAG. I have led customer proof-of-concepts,
                        designed solution architectures, and built hybrid data platforms. I enjoy
                        simplifying complex technology into practical, scalable solutions.
                      </p>
                    </div>
                    {/* Archival Pedigree Stamp Card */}
                    <div className="p-space-md bg-surface-container-low border border-surface-container-high rounded-lg flex flex-col gap-2 relative overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
                          <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold font-mono">
                            PROFILE DETAILS
                          </span>
                        </div>
                        <span className="distressed-stamp !text-[9px] !py-0.5">
                          AZURE DATA &amp; AI ENGINEERING
                        </span>
                      </div>
                      <p className="font-mono text-body-sm text-on-surface leading-relaxed">
                        Microsoft Fabric · Azure Data Factory · Lakehouse · Azure OpenAI · RAG · Data Engineering · ETL/ELT · AI Agents
                      </p>
                    </div>
                    {/* Core Engineering Maxims Grid */}
                    <div className="p-space-md bg-[#faf7f0] border border-outline-variant/40 rounded-lg flex flex-col gap-2.5">
                      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5">
                        <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline font-semibold">
                          TOP SKILLS
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          PROFILE SKILLS
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div className="p-2.5 bg-surface-container-lowest rounded border border-surface-container shadow-sm flex flex-col gap-1 transition-transform hover:-translate-y-0.5">
                          <span className="font-mono text-[11px] text-secondary font-bold">
                            01 // MICROSOFT FABRIC
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface font-medium">
                            Microsoft Fabric
                          </span>
                          <p className="text-[11px] text-on-surface-variant">
                            Data engineering and analytics with Microsoft Fabric.
                          </p>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded border border-surface-container shadow-sm flex flex-col gap-1 transition-transform hover:-translate-y-0.5">
                          <span className="font-mono text-[11px] text-secondary font-bold">
                            02 // KUSTO QUERY LANGUAGE
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface font-medium">
                            Kusto Query Language (KQL)
                          </span>
                          <p className="text-[11px] text-on-surface-variant">
                            Querying and exploring telemetry data.
                          </p>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded border border-surface-container shadow-sm flex flex-col gap-1 transition-transform hover:-translate-y-0.5">
                          <span className="font-mono text-[11px] text-secondary font-bold">
                            03 // AZURE AI
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface font-medium">
                            Anthropic Claude · Azure AI
                          </span>
                          <p className="text-[11px] text-on-surface-variant">
                            Applied AI tools and solutions.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-surface-container text-label-sm font-mono text-outline">
                      <span>LOCATION: {profile.location}</span>
                      <span className="text-secondary font-semibold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>{' '}
                        PROFILE DETAILS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Paper Mascot Card: Turing Bot Unit 734 (5 cols) */}
                <div
                  onClick={() => openDossier('unit-734')}
                  className="lg:col-span-5 pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:-rotate-1 animate-paper-drift cursor-pointer"
                  data-cursor="ROBOT"
                >
                  {/* Metallic Paperclip */}
                  <div className="metallic-clip -top-3.5 right-10 rotate-6"></div>
                  {/* 3D Brass Pushpin */}
                  <div className="pushpin-3d pin-brass -top-3 left-8"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[0.8deg] flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between px-1">
                      <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded uppercase tracking-wider font-mono">
                        FEATURED PROFILE CARD
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>{' '}
                        PROFILE DETAIL
                      </span>
                    </div>
                    {/* Mascot Tactile Image */}
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-surface-container-low border border-surface-container-high flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <img
                        alt="Decorative paper craft profile illustration"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src="/images/turing-bot.svg"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur border border-surface-container-high text-on-surface font-mono text-[10px] rounded shadow-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                        <span>DATA &amp; AI ENGINEERING</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Autonomous AI &amp; Lakehouse Architecture
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Architecting unified cloud data platforms, real-time analytics with Microsoft Fabric, and production-grade RAG reasoning pipelines.
                      </p>
                    </div>
                    {/* Telemetry Spec Chips */}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-label-sm">
                      <div className="p-2 bg-surface-container rounded border border-surface-container-high">
                        <div className="text-[9px] text-outline uppercase">DATA PLATFORM</div>
                        <div className="text-on-surface font-semibold">MICROSOFT FABRIC</div>
                      </div>
                      <div className="p-2 bg-surface-container rounded border border-surface-container-high">
                        <div className="text-[9px] text-outline uppercase">APPLIED AI</div>
                        <div className="text-secondary font-semibold">AZURE OPENAI</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-1 border-t border-surface-container">
                      <span className="font-mono text-label-sm text-outline">
                        FEATURED PROFILE CARD
                      </span>
                      <span className="distressed-stamp !text-[9px] !py-0.2 border-emerald-700 text-emerald-800">
                        SPEC: VERIFIED ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* SECTION 02: PROFESSIONAL EXPERIENCE (#experience)              */}
          {/* =============================================================== */}
          {isSectionVisible('experience') && (
            <section
              className="portfolio-section flex flex-col gap-space-lg scroll-mt-28 relative"
              data-section-cat="experience"
              id="experience"
            >
              <div className="absolute -top-5 right-2 reg-mark pointer-events-none">
                REG // TIMELINE — 02
              </div>
              {/* Bookmark Index Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest rounded-t shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">work_history</span>{' '}
                    SECTION 02
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Professional Experience &amp; Career Ledgers
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                  CAREER TIMELINE ARCHIVE
                </span>
              </div>

              {/* Career Timeline Grid: Archival Index Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-stretch">
                {/* ROLE 01: Experience */}
                <div
                  onClick={() => openDossier('role-dbx')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 flex flex-col cursor-pointer"
                  data-cursor="ROLE"
                >
                  {/* 3D Pushpin Top Center */}
                  <div className="pushpin-3d pin-red -top-3 left-8"></div>
                  {/* Washi Tape */}
                  <div className="washi-tape -top-2 right-6 w-24 h-5 -rotate-2"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[-0.7deg] flex flex-col justify-between h-full gap-space-md">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono text-[10px] rounded uppercase font-semibold">OCT 2025 — PRESENT</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] rounded font-bold">
                          PRESENT
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-headline-sm text-[20px] text-on-surface font-semibold">
                          Azure Data and AI Engineer
                        </h3>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          Quadrant Systems.net India Pvt Ltd
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Leading enterprise proof-of-concepts and architecting scalable data platforms on Microsoft Fabric and Azure Data Factory.</p>
                      <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-1.5">
                        <span className="font-label-sm text-[10px] text-outline uppercase font-mono tracking-wider font-semibold">
                          EXPERIENCE DETAILS
                        </span>
                        <ul className="text-[12px] space-y-1 font-mono text-on-surface"><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Designed end-to-end data pipelines and ETL/ELT workflows using Microsoft Fabric &amp; ADF.</li><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Implemented high-throughput Lakehouse ingestion, Delta tables, and KQL analytical queries.</li><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Led applied AI customer PoCs integrating Azure OpenAI with retrieval-augmented generation (RAG).</li></ul>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex items-center justify-between font-mono text-[11px]">
                      <span className="text-outline">Bengaluru, India</span>
                      <span className="text-secondary font-semibold">RECORD: VERIFIED ✓</span>
                    </div>
                  </div>
                </div>

                {/* ROLE 02: Experience */}
                <div
                  onClick={() => openDossier('role-har')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:-rotate-1 flex flex-col cursor-pointer"
                  data-cursor="ROLE"
                >
                  {/* 3D Pushpin */}
                  <div className="pushpin-3d pin-violet -top-3 left-1/2 -translate-x-1/2"></div>
                  {/* Corner tape */}
                  <div className="washi-tape -top-2 left-6 w-20 h-5 rotate-3"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[0.6deg] flex flex-col justify-between h-full gap-space-md bg-surface-container-low/60">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface font-mono text-[10px] rounded uppercase font-semibold">
                          AUG 2024 — APR 2025
                        </span>
                        <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] rounded font-bold">
                          9 MONTHS
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-headline-sm text-[20px] text-on-surface font-semibold">
                          Engineer Trainee
                        </h3>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          Cognizant
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Supported enterprise data transformation pipelines, database schema design, and automated pipeline validation.</p>
                      <div className="p-2.5 bg-surface-container-lowest rounded-lg border border-surface-container-high flex flex-col gap-1.5">
                        <span className="font-label-sm text-[10px] text-outline uppercase font-mono tracking-wider font-semibold">
                          EXPERIENCE DETAILS
                        </span>
                        <ul className="text-[12px] space-y-1 font-mono text-on-surface"><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Engineered cloud data ingestion workflows across relational and cloud stores.</li><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Automated data validation check suites, resolving pipeline schema drifts.</li><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Collaborated with engineering teams on SQL query optimization and indexing plans.</li></ul>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex items-center justify-between font-mono text-[11px]">
                      <span className="text-outline">Chennai, India</span>
                      <span className="text-secondary font-semibold">RECORD: VERIFIED ✓</span>
                    </div>
                  </div>
                </div>

                {/* ROLE 03: Experience */}
                <div
                  onClick={() => openDossier('role-csp')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 flex flex-col cursor-pointer"
                  data-cursor="ROLE"
                >
                  {/* 3D Pushpin */}
                  <div className="pushpin-3d pin-obsidian -top-3 right-8"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[-0.5deg] flex flex-col justify-between h-full gap-space-md">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono text-[10px] rounded uppercase font-semibold">JUL 2023 — JAN 2024</span>
                        <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant font-mono text-[10px] rounded font-bold">
                          7 MONTHS
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-headline-sm text-[20px] text-on-surface font-semibold">
                          Business Development Associate
                        </h3>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          BYJU’S
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Analyzed customer conversion telemetry, CRM metrics, and user engagement trends to drive business growth.</p>
                      <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-1.5">
                        <span className="font-label-sm text-[10px] text-outline uppercase font-mono tracking-wider font-semibold">
                          EXPERIENCE DETAILS
                        </span>
                        <ul className="text-[12px] space-y-1 font-mono text-on-surface"><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Audited high-volume CRM customer data metrics to identify growth opportunities.</li><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Synthesized user engagement patterns into data-backed strategy recommendations.</li><li className="flex items-start gap-1.5"><span className="text-secondary font-bold">•</span> Coordinated cross-functional workflows maintaining high data accuracy standards.</li></ul>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex items-center justify-between font-mono text-[11px]">
                      <span className="text-outline">Chennai, India</span>
                      <span className="text-secondary font-semibold">RECORD: VERIFIED ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* SECTION 03: PROJECTS & TECHNICAL BLUEPRINTS (#projects)        */}
          {/* =============================================================== */}
          {isSectionVisible('projects') && (
            <section
              className="portfolio-section flex flex-col gap-space-lg scroll-mt-28 relative"
              data-section-cat="projects"
              id="projects"
            >
              <div className="absolute -top-5 right-2 reg-mark pointer-events-none">
                REG // SCHEMATICS — 03
              </div>
              {/* Bookmark Index Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-widest rounded-t shadow-sm flex items-center gap-1.5 border-t border-x border-outline-variant/60">
                    <span className="material-symbols-outlined text-[14px]">architecture</span>{' '}
                    SECTION 03
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Projects
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                    4 LIVE PROTOTYPES
                  </span>
                  <input
                    ref={projectUploadRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    onChange={handleProjectUpload}
                    className="sr-only"
                    aria-label="Upload project images"
                  />
                  <button
                    type="button"
                    onClick={() => projectUploadRef.current?.click()}
                    data-cursor="UPLOAD"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary text-on-secondary rounded shadow-sm hover:bg-secondary/85 transition-all font-label-sm text-label-sm uppercase tracking-wider active:scale-95 whitespace-nowrap"
                    title="Add one or more project images"
                  >
                    <span className="material-symbols-outlined text-[15px]">upload_file</span>
                    Upload projects
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {FEATURED_PROJECTS.map((project) => {
                  const item = DOSSIER_ITEMS[project.id];
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => openProjectPrototype(project.id)}
                      className="pin-item relative group w-full text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary"
                      data-cursor="OPEN"
                      aria-label={`Open ${item.title} interactive scenario`}
                    >
                      <div className={`pushpin-3d ${project.accent} -top-3 left-8`}></div>
                      <div className="washi-tape -top-2 right-8 w-24 h-5 rotate-3"></div>
                      <div className="deckled-card p-space-sm pb-space-md rounded-xl flex flex-col gap-space-sm">
                        <ProjectPreview projectId={project.id} />
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">{project.label}</span>
                            <span className="font-mono text-[10px] text-secondary font-bold">{project.status}</span>
                          </div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">{item.title}</h3>
                          <p className="font-body-sm text-on-surface-variant">{project.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-1 font-mono text-[10px]">{project.tags.map((tag) => <span key={tag} className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">{tag}</span>)}</div>
                        <div className="flex items-center justify-between px-1 pt-3 border-t border-surface-container">
                          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold"><span className="material-symbols-outlined text-[15px]">play_arrow</span>Open scenario</span>
                          <span className="font-mono text-label-sm text-outline">FIG. {project.figure}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* BLUEPRINT 00: CITATION-FIRST DOCS ASSISTANT */}
                <div
                  onClick={() => openDossier('blueprint-00')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="INSPECT"
                >
                  <div className="pushpin-3d pin-violet -top-3 left-8"></div>
                  <div className="washi-tape -top-2 right-5 w-24 h-5 rotate-3"></div>
                  <div className="deckled-card p-space-sm pb-space-md rounded-xl rotate-[0.4deg] flex flex-col gap-space-sm">
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded bg-[#25213d] border border-surface-container-high p-4 text-white">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_75%_20%,#b8a6ff,transparent_35%),linear-gradient(135deg,#2f2a50,#171525)]"></div>
                      <div className="relative h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest">
                          <span>DOCS // VERIFIED</span>
                          <span className="text-violet-200">PILOT 0→1</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-4/5 rounded bg-white/90"></div>
                          <div className="h-2 w-3/5 rounded bg-white/55"></div>
                          <div className="flex gap-2 pt-2">
                            <span className="rounded bg-violet-300/25 px-2 py-1 font-mono text-[9px] text-violet-100">[1] Source</span>
                            <span className="rounded bg-white/15 px-2 py-1 font-mono text-[9px]">Abstain safe</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                          BLUEPRINT // 00
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">PILOT PLANNED</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">AskDocs</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        An evidence-first AI feature for technical documentation: verifiable citations,
                        explicit abstention, and a real-user pilot designed around measurable quality.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded font-medium">RAG Evaluation</span>
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface rounded font-medium">Pilot Research</span>
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">No user data yet</span>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-2 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDossier('blueprint-00');
                        }}
                        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-secondary uppercase tracking-widest font-semibold"
                        data-cursor="SPECS"
                      >
                        Inspect Product Brief <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                      <span className="font-mono text-label-sm text-outline">FIG. 4A</span>
                    </div>
                  </div>
                </div>

                {false && (
                  <>
                {/* Legacy project cards hidden at the portfolio owner's request. */}
                {/* BLUEPRINT 01: NEXUSSTREAM */}
                <div
                  onClick={() => openDossier('blueprint-01')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="INSPECT"
                >
                  {/* 3D Pushpin */}
                  <div className="pushpin-3d pin-red -top-3 left-6"></div>
                  {/* Tape Corner */}
                  <div className="washi-tape -top-2 right-4 w-20 h-5 -rotate-6"></div>
                  <div className="deckled-card p-space-sm pb-space-md rounded-xl rotate-[-0.5deg] flex flex-col gap-space-sm">
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded bg-primary border border-surface-container-high">
                      <img
                        alt="Distributed Real-Time Stream Processing and LLM Inference Engine architecture diagram"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="/images/doc-pipeline.svg"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 text-on-primary font-mono text-[10px] rounded uppercase tracking-wider backdrop-blur border border-white/20">
                        TOPOLOGY SPEC
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                          BLUEPRINT // 01
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          p99 &lt; 38ms
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        NexusStream: Stateful LLM Serving Mesh
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Hybrid distributed event loop unifying Apache Flink stateful aggregations
                        with dynamic vLLM tensor-parallel worker nodes. Sub-50ms token latency under
                        10 GB/s continuous ingress.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface rounded font-medium">
                        10 GB/s Stream
                      </span>
                      <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded font-medium">
                        vLLM + Flink
                      </span>
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                        Milvus Index
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-2 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDossier('blueprint-01');
                        }}
                        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-secondary uppercase tracking-widest font-semibold"
                        data-cursor="SPECS"
                      >
                        Inspect Architecture{' '}
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                      <span className="font-mono text-label-sm text-outline">FIG. 4A</span>
                    </div>
                  </div>
                </div>

                {/* BLUEPRINT 02: AGENTFLOW */}
                <div
                  onClick={() => openDossier('blueprint-02')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="INSPECT"
                >
                  {/* 3D Pushpin */}
                  <div className="pushpin-3d pin-violet -top-3 left-8"></div>
                  <div className="washi-tape -top-2.5 right-6 w-24 h-5 rotate-3"></div>
                  <div className="deckled-card p-space-sm pb-space-md rounded-xl rotate-[0.6deg] flex flex-col gap-space-sm">
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded bg-primary border border-surface-container-high">
                      <img
                        alt="AgentFlow multi-agent orchestration reasoning chains and telemetry evaluation suite"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="/images/rag-system.svg"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-surface-container-lowest/90 text-on-surface font-mono text-[10px] rounded uppercase tracking-wider backdrop-blur border border-surface-container-high">
                        AGENT TELEMETRY LAB
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                          BLUEPRINT // 02
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          8,450 tok/s
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        AgentFlow: High-Yield Chain Telemetry
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Full-lifecycle autonomous agent evaluator tracking step-level reasoning
                        DAGs, automated guardrail verification, and cost-per-call telemetry in
                        real-time.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface rounded font-medium">
                        99.8% Guardrails
                      </span>
                      <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded font-medium">
                        $4.51/hr Compute
                      </span>
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                        DAG Visualizer
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-2 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDossier('blueprint-02');
                        }}
                        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-secondary uppercase tracking-widest font-semibold"
                        data-cursor="SPECS"
                      >
                        Inspect Reasoning Protocol{' '}
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                      <span className="font-mono text-label-sm text-outline">FIG. 4B</span>
                    </div>
                  </div>
                </div>

                {/* BLUEPRINT 03: OMNILAKE */}
                <div
                  onClick={() => openDossier('blueprint-03')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="INSPECT"
                >
                  {/* 3D Pushpin */}
                  <div className="pushpin-3d pin-brass -top-3 right-8"></div>
                  <div className="washi-tape -top-3 left-4 w-24 h-5 -rotate-3"></div>
                  <div className="deckled-card p-space-sm pb-space-md rounded-xl rotate-[-0.8deg] flex flex-col gap-space-sm">
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded bg-primary border border-surface-container-high">
                      <img
                        alt="Data Lakehouse Query Optimization at Petabyte Scale architecture topology"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="/images/lakehouse-platform.svg"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 text-on-primary font-mono text-[10px] rounded uppercase tracking-wider backdrop-blur border border-white/20">
                        14.6 PB PRODUCTION
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                          BLUEPRINT // 03
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          1.18s Query Time
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        OmniLake: Petabyte Parquet Topology
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        High-cardinality metadata compaction and zero-copy columnar execution over
                        2.1 billion files, yielding a 94.1% partition pruning rate and 74% compute
                        reduction.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface rounded font-medium">
                        14.6 PB Lake
                      </span>
                      <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded font-medium">
                        Apache Iceberg
                      </span>
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                        94.1% Pruned
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-2 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDossier('blueprint-03');
                        }}
                        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-secondary uppercase tracking-widest font-semibold"
                        data-cursor="SPECS"
                      >
                        Inspect Lakehouse Spec{' '}
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                      <span className="font-mono text-label-sm text-outline">FIG. 4C</span>
                    </div>
                  </div>
                </div>

                  </>
                )}

                {/* BLUEPRINT 04: PDF RAG CHATBOT */}
                <div
                  onClick={() => setIsPdfProjectOpen(true)}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="DEMO"
                >
                  <div className="pushpin-3d pin-violet -top-3 right-8"></div>
                  <div className="washi-tape -top-2 left-5 w-24 h-5 -rotate-3"></div>
                  <div className="deckled-card p-space-sm pb-space-md rounded-xl rotate-[0.7deg] flex flex-col gap-space-sm">
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded bg-[#1f193a] border border-surface-container-high flex items-center justify-center">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#a78bfa,transparent_30%),radial-gradient(circle_at_80%_75%,#38bdf8,transparent_32%)]"></div>
                      <div className="relative flex flex-col items-center gap-2 text-center text-white px-5">
                        <span className="material-symbols-outlined text-[46px] text-violet-200">picture_as_pdf</span>
                        <span className="font-mono text-[11px] tracking-[0.22em] uppercase">Document Intelligence</span>
                        <span className="px-2 py-0.5 rounded bg-white/15 border border-white/25 font-mono text-[10px]">RAG CHAT ENABLED</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">BLUEPRINT // 04</span>
                        <span className="font-mono text-label-sm text-secondary font-bold">CLIENT-SIDE AI</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">PDF Text Extraction &amp; Grounded RAG Chatbot</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Upload a PDF, extract its content, and ask grounded questions using the interactive document intelligence demo.</p>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-2 border-t border-surface-container">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold">Open interactive demo <span className="material-symbols-outlined text-[14px]">arrow_forward</span></span>
                      <span className="font-mono text-label-sm text-outline">FIG. 4D</span>
                    </div>
                  </div>
                </div>

                {uploadedProjects.map((project, index) => (
                  <article
                    key={project.id}
                    className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1"
                    data-cursor="PROJECT"
                  >
                    <div className={`pushpin-3d ${index % 2 === 0 ? 'pin-violet' : 'pin-brass'} -top-3 left-8`}></div>
                    <div className="washi-tape -top-2 right-6 w-20 h-5 rotate-3"></div>
                    <div className="deckled-card p-space-sm pb-space-md rounded-xl rotate-[0.6deg] flex flex-col gap-space-sm">
                      <div className="relative w-full aspect-[16/10] overflow-hidden rounded bg-primary border border-surface-container-high">
                        <img
                          alt={`Project preview for ${project.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={project.previewUrl}
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 text-on-primary font-mono text-[10px] rounded uppercase tracking-wider backdrop-blur border border-white/20">
                          UPLOADED PROJECT
                        </span>
                        <button
                          type="button"
                          onClick={() => removeUploadedProject(project.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/65 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                          aria-label={`Remove ${project.name}`}
                          title="Remove project"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 px-1">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                          BLUEPRINT // {String(5 + index).padStart(2, '0')}
                        </span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface capitalize">{project.name}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          New project preview uploaded from {project.fileName}. Add it to your portfolio with its final project details when ready.
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

            </section>
          )}

          {/* =============================================================== */}
          {/* SECTION 04: EDUCATION & ACADEMICS (#education)                  */}
          {/* =============================================================== */}
          {isSectionVisible('education') && (
            <section
              className="portfolio-section flex flex-col gap-space-lg scroll-mt-28 relative"
              data-section-cat="education"
              id="education"
            >
              <div className="absolute -top-5 right-2 reg-mark pointer-events-none">
                REG // ACADEMIA — 04
              </div>
              {/* Bookmark Index Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-widest rounded-t shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">school</span> SECTION 04
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Education &amp; Academic Research Ledgers
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                  ACADEMIC ARCHIVE // 2 DEGREES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-stretch">
                {/* DIPLOMA 01: Stanford / M.S. */}
                <div
                  onClick={() => openDossier('edu-stanford')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="STANFORD"
                >
                  {/* Metallic Paperclip */}
                  <div className="metallic-clip -top-3.5 left-10 -rotate-3"></div>
                  {/* Distressed Rubber stamp seal */}
                  <div className="absolute bottom-6 right-6 distressed-stamp text-[10px] -rotate-6 pointer-events-none">
                    CONFERRED // DISTINCTION
                  </div>
                  <div className="deckled-card p-space-lg rounded-xl rotate-[-0.6deg] flex flex-col justify-between h-full gap-space-md">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface font-mono text-[10px] rounded uppercase font-semibold">
                          GRADUATE RESEARCH // STANFORD
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          2015 — 2017
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-headline-md text-[24px] text-on-surface">
                          Master of Science in Computer Science
                        </h3>
                        <span className="font-mono text-label-sm text-secondary font-semibold">
                          Stanford University // Distributed Systems Specialization
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        Graduate thesis focused on asynchronous consensus algorithms, memory-bounded
                        distributed state stores, and pipelined GPU communication topologies under
                        heterogeneous network latency.
                      </p>
                      <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-1.5 font-mono text-[12px]">
                        <span className="text-outline uppercase text-[10px] font-semibold">
                          RESEARCH FOCUS &amp; PUBLICATIONS
                        </span>
                        <div className="text-on-surface space-y-1">
                          <div>
                            • Thesis:{' '}
                            <span className="italic font-serif">
                              Fault-Tolerant Actor Meshes in Partitioned Distributed Memory
                            </span>
                          </div>
                          <div>• Advisor: Distributed Computing &amp; Systems Architecture Lab</div>
                          <div>
                            • Coursework: Advanced Operating Systems, Distributed Hash Tables,
                            Large-Scale Machine Learning Runtimes
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-surface-container flex items-center justify-between font-mono text-[11px] text-outline">
                      <span className="distressed-stamp !text-[9px] !py-0.2">
                        STANFORD CS DIPLOMA REF
                      </span>
                      <span className="text-secondary font-semibold">GPA: 3.94 / 4.0</span>
                    </div>
                  </div>
                </div>

                {/* DIPLOMA 02: UC Berkeley / B.S. */}
                <div
                  onClick={() => openDossier('edu-berkeley')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:-rotate-1 cursor-pointer"
                  data-cursor="BERKELEY"
                >
                  {/* Washi Tape */}
                  <div className="washi-tape -top-3 right-10 w-28 h-6 rotate-2">
                    <span className="font-mono text-[8px] text-outline tracking-widest uppercase flex items-center justify-center h-full">
                      REGISTRAR RECORD
                    </span>
                  </div>
                  <div className="deckled-card p-space-lg rounded-xl rotate-[0.6deg] flex flex-col justify-between h-full gap-space-md">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface font-mono text-[10px] rounded uppercase font-semibold">
                          UNDERGRADUATE // UC BERKELEY
                        </span>
                        <span className="font-mono text-label-sm text-secondary font-bold">
                          2011 — 2015
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-headline-md text-[24px] text-on-surface">
                          Bachelor of Science in Computer Engineering
                        </h3>
                        <span className="font-mono text-label-sm text-secondary font-semibold">
                          University of California, Berkeley // EECS Honors Program
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        Concentration in Computer Architecture, Parallel Computing, and
                        Hardware-Software Co-Design. Senior capstone: Low-overhead zero-copy packet
                        switching on FPGA accelerators.
                      </p>
                      <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-1.5 font-mono text-[12px]">
                        <span className="text-outline uppercase text-[10px] font-semibold">
                          HONORS &amp; LAB ENGAGEMENTS
                        </span>
                        <div className="text-on-surface space-y-1">
                          <div>
                            • Magna Cum Laude // Eta Kappa Nu (IEEE EECS Honor Society)
                          </div>
                          <div>
                            • Research Assistant: RISELab / AMPLab Distributed Analytics Group
                          </div>
                          <div>
                            • Capstone: FPGA acceleration for streaming sliding-window joins
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-surface-container flex items-center justify-between font-mono text-[11px] text-outline">
                      <span>DIPLOMA REF: UCB-EECS-HON-3829</span>
                      <span className="distressed-stamp !text-[9px] !py-0.2 border-emerald-700 text-emerald-800">
                        HONORS GRADUATE ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* SECTION 05: CERTIFICATIONS & BADGES (#certificates)             */}
          {/* =============================================================== */}
          {isSectionVisible('certificates') && (
            <section
              className="portfolio-section flex flex-col gap-space-lg scroll-mt-28 relative"
              data-section-cat="certificates"
              id="certificates"
            >
              <div className="absolute -top-5 right-2 reg-mark pointer-events-none">
                REG // ACCREDITATIONS — 05
              </div>
              {/* Bookmark Index Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest rounded-t shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">verified</span> SECTION
                    05
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Certifications &amp; Stamped Accreditations
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                  4 ACTIVE SPECIALIZATIONS
                </span>
              </div>

              {/* Stamped Archival Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
                {/* CERT 01: AWS Solutions Architect Pro */}
                <div
                  onClick={() => openDossier('cert-aws')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="AWS"
                >
                  <div className="pushpin-3d pin-red -top-3 left-6"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[-0.8deg] flex flex-col justify-between h-full gap-space-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs font-mono shadow-inner border border-amber-200">
                          AWS
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[9px] font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                        AWS Certified Solutions Architect – Professional
                      </h4>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        Multi-region high availability, hybrid cloud DirectConnect, disaster
                        recovery DAGs, and Petabyte S3/Glacier lifecycle policies.
                      </p>
                    </div>
                    <div className="p-2 bg-surface-container-low rounded border border-surface-container font-mono text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-outline">BADGE ID:</span>
                        <span className="text-on-surface font-semibold">AWS-PSA-99214</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">VALIDITY:</span>
                        <span className="text-secondary font-bold">2024 — 2027</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CERT 02: Databricks Machine Learning & Spark */}
                <div
                  onClick={() => openDossier('cert-dbx')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="SPARK"
                >
                  <div className="pushpin-3d pin-violet -top-3 right-6"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[0.7deg] flex flex-col justify-between h-full gap-space-sm bg-surface-container-low/50">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xs font-mono shadow-inner border border-orange-200">
                          DBX
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[9px] font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                        Databricks Certified Spark Systems Architect
                      </h4>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        Catalyst Optimizer internals, Adaptive Query Execution (AQE), Delta Lake
                        ACID log protocols, and streaming stateful joins.
                      </p>
                    </div>
                    <div className="p-2 bg-surface-container-lowest rounded border border-surface-container font-mono text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-outline">BADGE ID:</span>
                        <span className="text-on-surface font-semibold">DBX-ARC-81203</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">VALIDITY:</span>
                        <span className="text-secondary font-bold">2023 — 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CERT 03: NVIDIA CUDA & Distributed DL */}
                <div
                  onClick={() => openDossier('cert-nvda')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="CUDA"
                >
                  <div className="pushpin-3d pin-brass -top-3 left-6"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[-0.5deg] flex flex-col justify-between h-full gap-space-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-lg bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs font-mono shadow-inner border border-green-200">
                          NVDA
                        </span>
                        <span className="distressed-stamp !text-[8px] !py-0.2">CUDA OPTIMIZED</span>
                      </div>
                      <h4 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                        NVIDIA CUDA &amp; Distributed Deep Learning Specialist
                      </h4>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        CUDA 12.x kernel optimization, NCCL collective communications, Megatron-LM
                        tensor parallelisms, and Warp-specialized FlashAttention.
                      </p>
                    </div>
                    <div className="p-2 bg-surface-container-low rounded border border-surface-container font-mono text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-outline">BADGE ID:</span>
                        <span className="text-on-surface font-semibold">NVA-DLS-55410</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">VALIDITY:</span>
                        <span className="text-secondary font-bold">LIFETIME // PROD</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CERT 04: CKA Kubernetes */}
                <div
                  onClick={() => openDossier('cert-cka')}
                  className="pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="K8S"
                >
                  <div className="pushpin-3d pin-red -top-3 right-8"></div>
                  <div className="deckled-card p-space-md rounded-xl rotate-[0.9deg] flex flex-col justify-between h-full gap-space-sm bg-surface-container-low/50">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs font-mono shadow-inner border border-blue-200">
                          CNCF
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[9px] font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                        Certified Kubernetes Administrator (CKA)
                      </h4>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        Linux Foundation / Cloud Native Computing Foundation: Cluster lifecycle,
                        etcd backup/restore, dynamic GPU device plugins, and Cilium eBPF network
                        overlays.
                      </p>
                    </div>
                    <div className="p-2 bg-surface-container-lowest rounded border border-surface-container font-mono text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-outline">BADGE ID:</span>
                        <span className="text-on-surface font-semibold">CKA-2400-8841</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">VALIDITY:</span>
                        <span className="text-secondary font-bold">2024 — 2027</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* SECTION 06: CONTACT DETAILS & DIRECT DISPATCH (#contact)        */}
          {/* =============================================================== */}
          {isSectionVisible('contact') && (
            <section
              className="portfolio-section flex flex-col gap-space-lg scroll-mt-28 relative"
              data-section-cat="contact"
              id="contact"
            >
              <div className="absolute -top-5 right-2 reg-mark pointer-events-none">
                REG // DISPATCH — 06
              </div>
              {/* Bookmark Index Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-widest rounded-t shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">send</span> SECTION 06
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Contact Details &amp; Direct Dispatch
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="distressed-stamp distressed-stamp-violet !text-[9px] !py-0.5">
                    H1 2025 ADVISORY
                  </span>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono tracking-wider">
                    OFFICIAL ADVISORY MEMO
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
                {/* Archival Dispatch Note Card (7 cols) */}
                <div
                  className="lg:col-span-7 pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1"
                  data-cursor="DISPATCH"
                >
                  {/* Dual 3D Pushpins */}
                  <div className="pushpin-3d pin-red -top-3 left-8"></div>
                  <div className="pushpin-3d pin-red -top-3 right-8"></div>
                  <div className="deckled-card !bg-[#faf7f0] p-space-lg rounded-xl rotate-[-0.6deg] flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono text-[11px] uppercase tracking-wider rounded">
                        MEMO // DIRECT DISPATCH SPEC
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-label-sm text-secondary font-semibold">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>{' '}
                        ACCEPTING H1 ADVISORY
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider font-mono">
                        [ COLLABORATION &amp; ADVISORY LEDGER ]
                      </span>
                      <h3 className="font-headline-lg text-headline-lg text-on-surface leading-tight">
                        Ready to architect zero-overhead systems?
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Accepting select advisory engagements, executive fractional architecture
                        roles, and principal engineering challenges for high-throughput distributed
                        AI infrastructure and data platforms.
                      </p>
                    </div>
                    {/* Interactive Direct Dispatch Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-1">
                      <button
                        type="button"
                        onClick={handleCopyDispatchEmail}
                        data-cursor="COPY"
                        className={`h-12 px-space-md text-on-primary transition-all rounded-lg font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm font-semibold active:scale-95 ${
                          dispatchCopied ? 'bg-emerald-700' : 'bg-primary hover:bg-[#222]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {dispatchCopied ? 'check_circle' : 'content_copy'}
                        </span>
                        <span>
                          {dispatchCopied ? 'Email Copied! ✓' : 'Copy Direct Email'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDispatchModal('20-Min Intro Call Request')}
                        data-cursor="CALL"
                        className="h-12 px-space-md bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/60 transition-all rounded-lg font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-2 font-semibold shadow-sm hover:-translate-y-0.5"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          calendar_month
                        </span>
                        Schedule 20-Min Intro
                      </button>
                    </div>
                    {/* Security & Coordinates Verification Card */}
                    <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-1.5 font-mono text-[12px]">
                      <div className="flex items-center justify-between">
                        <span className="text-outline uppercase text-[10px]">EMAIL ADDRESS:</span>
                        <span className="text-on-surface font-semibold selection:bg-secondary-container">
                          pragatheshpragathesh@gmail.com
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-outline uppercase text-[10px]">PGP FINGERPRINT:</span>
                        <span className="text-secondary font-bold">9B4E 21D0 9A8F 331C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-outline uppercase text-[10px]">
                          DISPATCH LOCATION:
                        </span>
                        <span className="text-on-surface">BENGALURU, KARNATAKA, INDIA</span>
                      </div>
                    </div>
                    {/* External Archival References */}
                    <div className="flex flex-wrap items-center justify-between pt-1 border-t border-surface-container font-mono text-label-sm">
                      <span className="text-outline text-[11px] uppercase tracking-wider">
                        EXTERNAL LEDGERS:
                      </span>
                      <div className="flex items-center gap-space-sm">
                        <a
                          className="text-primary hover:text-secondary uppercase font-semibold flex items-center gap-1 transition-colors"
                          data-cursor="GITHUB"
                          href="https://github.com"
                          rel="noreferrer"
                          target="_blank"
                        >
                          GitHub{' '}
                          <span className="material-symbols-outlined text-[12px]">
                            arrow_outward
                          </span>
                        </a>
                        <span className="text-outline">/</span>
                        <a
                          className="text-primary hover:text-secondary uppercase font-semibold flex items-center gap-1 transition-colors"
                          data-cursor="ARXIV"
                          href="https://arxiv.org"
                          rel="noreferrer"
                          target="_blank"
                        >
                          ArXiv{' '}
                          <span className="material-symbols-outlined text-[12px]">
                            arrow_outward
                          </span>
                        </a>
                        <span className="text-outline">/</span>
                        <a
                          className="text-primary hover:text-secondary uppercase font-semibold flex items-center gap-1 transition-colors"
                          data-cursor="SUBSTACK"
                          href="https://substack.com"
                          rel="noreferrer"
                          target="_blank"
                        >
                          Substack{' '}
                          <span className="material-symbols-outlined text-[12px]">
                            arrow_outward
                          </span>
                        </a>
                        <span className="text-outline">/</span>
                        <a
                          className="text-primary hover:text-secondary uppercase font-semibold flex items-center gap-1 transition-colors"
                          data-cursor="LINKEDIN"
                          href="https://linkedin.com"
                          rel="noreferrer"
                          target="_blank"
                        >
                          LinkedIn{' '}
                          <span className="material-symbols-outlined text-[12px]">
                            arrow_outward
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vintage Cluster Polaroid Physical Photo (5 cols) */}
                <div
                  onClick={() => openDossier('polaroid-88')}
                  className="lg:col-span-5 pin-item relative group transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer"
                  data-cursor="PHOTO"
                >
                  <div className="washi-tape -top-3 left-1/2 -translate-x-1/2 w-32 h-6 rotate-1">
                    <span className="font-mono text-[8px] text-outline uppercase tracking-widest flex items-center justify-center h-full">
                      POLAROID ARCHIVE #88
                    </span>
                  </div>
                  {/* Corner Pin */}
                  <div className="pushpin-3d pin-brass -top-2 left-6"></div>
                  <div className="deckled-card p-space-sm pb-space-lg rounded-xl rotate-[1.5deg] flex flex-col gap-space-sm bg-[#faf8f5]">
                    <div className="w-full aspect-[4/3] overflow-hidden rounded bg-inverse-surface border border-surface-container-high relative">
                      <img
                        alt="Archival photography of modern high-density NVIDIA H100 AI server racks in an datacenter, ambient blue and amber LED indicator lights"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="/images/datacenter-cluster.svg"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white font-mono text-[9px] rounded uppercase backdrop-blur">
                        RACK B-04
                      </div>
                    </div>
                    <div className="px-space-xs flex flex-col gap-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="polaroid-script text-2xl text-on-surface leading-tight font-bold">
                          “DGX H100 Cluster Rack B-04 / Night Run”
                        </span>
                        <span className="distressed-stamp !text-[8px] !py-0 border-outline text-outline">
                          STAMPED #88
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-outline font-mono text-[11px] uppercase pt-1 border-t border-surface-container">
                        <span>RACK TEMPS: 21.4°C</span>
                        <span className="text-secondary font-semibold">NVLINK MESH ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Archival Ledger Summary Helper Banner */}
          <div className="w-full py-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md bg-surface-container-low px-space-md rounded-xl border border-surface-container-high shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                auto_stories
              </span>
              <span className="font-body-sm text-body-sm text-on-surface">
                All technical blueprints, career ledgers, and academic citations are open for peer
                architectural review and advisory dispatch.
              </span>
            </div>
            <div className="flex items-center gap-space-sm font-mono text-label-sm text-outline uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SYSTEM STATUS: ALL CLUSTERS NOMINAL</span>
            </div>
          </div>
        </div>
      </main>

      {/* =============================================================== */}
      {/* FOOTER                                                          */}
      {/* =============================================================== */}
      <footer className="w-full bg-surface-container-low border-t border-surface-container-high shadow-[0_-1px_12px_rgba(45,36,28,0.03)] relative z-10">
        <div className="w-full px-margin-sm lg:px-margin py-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg border-b border-surface-container">
            <div className="flex flex-col gap-space-xs">
              <span className="font-headline-md text-headline-md text-on-surface">
                Pragatheesh // Studio &amp; Systems Ledger
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl">
                Tactile digital atelier archiving production machine learning topology,
                high-throughput distributed state stores, and editorial notes on synthetic
                cognition.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
              <span className="px-space-sm py-1 bg-surface-container-high rounded border border-surface-container-highest">
                LOC: 37.7749° N, 122.4194° W
              </span>
              <span className="px-space-sm py-1 bg-surface-container-high rounded border border-surface-container-highest">
                STAMP: 2025.H1.REV04
              </span>
              <span className="px-space-sm py-1 bg-secondary-fixed text-on-secondary-fixed rounded font-semibold">
                PGP: 0x9B4E21D09A8F
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              © 2025 Pragatheesh. Handcrafted tactile pinboard in EB Garamond &amp; Hanken Grotesk.
            </div>
            <div className="flex flex-wrap items-center gap-space-md font-label-sm text-label-sm text-on-surface uppercase tracking-widest font-mono">
              <a
                className="hover:text-secondary transition-colors"
                data-cursor="ABOUT"
                href="#about"
                onClick={(e) => handleNavigateSection(e, 'about')}
              >
                01 About
              </a>
              <a
                className="hover:text-secondary transition-colors"
                data-cursor="WORK"
                href="#experience"
                onClick={(e) => handleNavigateSection(e, 'experience')}
              >
                02 Experience
              </a>
              <a
                className="hover:text-secondary transition-colors"
                data-cursor="PROJ"
                href="#projects"
                onClick={(e) => handleNavigateSection(e, 'projects')}
              >
                03 Projects
              </a>
              <a
                className="hover:text-secondary transition-colors"
                data-cursor="EDU"
                href="#education"
                onClick={(e) => handleNavigateSection(e, 'education')}
              >
                04 Education
              </a>
              <a
                className="hover:text-secondary transition-colors"
                data-cursor="CERTS"
                href="#certificates"
                onClick={(e) => handleNavigateSection(e, 'certificates')}
              >
                05 Certifications
              </a>
              <a
                className="hover:text-secondary transition-colors"
                data-cursor="DISPATCH"
                href="#contact"
                onClick={(e) => handleNavigateSection(e, 'contact')}
              >
                06 Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Archival Dossier & Blueprint Inspector Modal */}
      <DossierModal
        item={selectedDossier}
        onClose={() => setSelectedDossier(null)}
        onOpenDispatch={(subj) => openDispatchModal(subj)}
        onLaunchDemo={(item) => {
          if (isProjectPrototypeId(item.id)) openProjectPrototype(item.id);
        }}
      />

      {activePrototype && <ProjectPrototypeModal projectId={activePrototype} onClose={() => setActivePrototype(null)} />}

      {/* Interactive Direct Advisory Dispatch & 20-Min Intro Scheduler Modal */}
      <DispatchMemoModal
        isOpen={isDispatchModalOpen}
        initialSubject={dispatchSubject}
        onClose={() => setIsDispatchModalOpen(false)}
      />

      {isPdfProjectOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-inverse-surface/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsPdfProjectOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="PDF Text Extraction and Grounded RAG Chatbot"
        >
          <div
            className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto deckled-card !bg-[#fcf9f2] paper-texture p-3 sm:p-space-md rounded-xl border border-outline-variant shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPdfProjectOpen(false)}
              className="sticky float-right top-1 z-20 w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface flex items-center justify-center transition-colors"
              aria-label="Close PDF RAG demo"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <PdfIntelligenceWorkbench />
          </div>
        </div>
      )}
    </div>
  );
}
