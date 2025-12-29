"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Linkedin } from "lucide-react";

type NavKey =
  | "home"
  | "about"
  | "academics"
  | "skills"
  | "projects"
  | "certificates"
  | "contact";

type NavItem = { key: NavKey; label: string };

type AcademicItem = {
  degree: string;
  year: string;
  institution: string;
  score: string;
};

type ProjectItem = {
  title: string;
  description: string;
  image: string;
  github: string;
};

type CertificateItem = {
  title: string;
  image: string;
  issuer: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useScrolled(thresholdPx: number) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > thresholdPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdPx]);

  return scrolled;
}

function useRevealOnScroll() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.add("reveal-show");
          target.classList.remove("reveal-hidden");
          io.unobserve(target);
        }
      },
      { threshold: 0.15 }
    );

    for (const n of nodes) io.observe(n);
    return () => io.disconnect();
  }, []);
}

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const full = "Transforming Ideas into Reality...";
  const [txt, setTxt] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const [visible, setVisible] = useState(true);

  const timeoutRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setVisible(false);
    timeoutRef.current = window.setTimeout(onDone, 120);
  }, [onDone]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish]);

  useEffect(() => {
    const TYPE_MS = 22; // faster typing
    const PAUSE_MS = 220; // shorter pause
    const DELETE_MS = 14; // faster delete

    const schedule = (fn: () => void, ms: number) => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(fn, ms);
    };

    const tick = () => {
      if (doneRef.current) return;

      if (phase === "typing") {
        const next = full.slice(0, txt.length + 1);
        setTxt(next);
        if (next.length === full.length) {
          schedule(() => setPhase("pause"), PAUSE_MS);
          return;
        }
        schedule(tick, TYPE_MS);
        return;
      }

      if (phase === "pause") {
        setPhase("deleting");
        schedule(tick, DELETE_MS);
        return;
      }

      // deleting
      const next = txt.slice(0, Math.max(0, txt.length - 1));
      setTxt(next);
      if (next.length === 0) {
        finish();
        return;
      }
      schedule(tick, DELETE_MS);
    };

    schedule(tick, 40); // quicker start
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [finish, full, phase, txt]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] grid place-items-center bg-slate-950 text-slate-100 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-label="Loading"
      onClick={finish} // click anywhere to skip
    >
      <div className="px-6 text-center">
        <div
          className="mx-auto inline-flex max-w-[900px] items-center justify-center rounded-2xl border border-emerald-400/20 bg-slate-900/40 px-5 py-4 shadow-[0_0_0_1px_rgba(16,185,129,0.08)] backdrop-blur"
          style={{
            fontFamily:
              "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <span className="text-base sm:text-lg md:text-xl">
            {txt}
            <span className="ml-0.5 inline-block w-[10px] animate-pulse text-emerald-300">
              |
            </span>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <p className="text-xs text-slate-400">Loading portfolio…</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            className="rounded-lg border border-emerald-400/20 bg-slate-900/30 px-2.5 py-1 text-xs text-slate-200 transition hover:border-emerald-400/45 hover:bg-slate-900/60"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function IconLink({
  href,
  label,
  iconUrl,
  icon,
}: {
  href: string;
  label: string;
  iconUrl?: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group inline-flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 transition hover:border-emerald-400/40 hover:bg-slate-900/70"
    >
      {icon ? (
        icon
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl ?? ""}
          alt=""
          className="h-5 w-5 opacity-90 transition group-hover:opacity-100"
        />
      )}
      <span className="text-slate-200 group-hover:text-slate-50">{label}</span>
    </a>
  );
}

export default function Home() {
  const navItems: NavItem[] = useMemo(
    () => [
      { key: "home", label: "Home" },
      { key: "about", label: "About" },
      { key: "academics", label: "Academics" },
      { key: "skills", label: "Skills" },
      { key: "projects", label: "Projects" },
      { key: "certificates", label: "Certificates" },
      { key: "contact", label: "Contact" },
    ],
    []
  );

  const academics: AcademicItem[] = useMemo(
    () => [
      {
        degree: "Masters In Computer Application",
        year: "2023 - 2025",
        institution: "Saraswati College Shegaon | Amravati University",
        score: "CGPA: 8.59",
      },
      {
        degree: "Bachelor's Of Science (B.Sc)",
        year: "2020 - 2023",
        institution:
          "Shri. D. M. B. Science & Art's College Shegaon | Amravati University",
        score: "Marks: 75.85%",
      },
      {
        degree: "HSC",
        year: "2018 - 2020",
        institution: "R. P. M. G. College Shegaon | Amravati University",
        score: "Marks: 64%",
      },
      {
        degree: "SSC",
        year: "2017 - 2018",
        institution: "Shri. M. B. B. V. Shegaon | Amravati University",
        score: "Marks: 76.40%",
      },
    ],
    []
  );

  const projects: ProjectItem[] = useMemo(
    () => [
      {
        title: "Bio-Signal Based Cancer Detection System",
        description:
          "This project is a full-stack healthcare application designed to assist in early cancer risk detection using non-invasive bio-signals and behavioral data. The system analyzes multiple human parameters such as voice patterns, pulse signals, facial expressions, and motor movements, combined with patient medical records, to support data-driven health assessment. The backend is powered by Spring Boot REST APIs, enabling secure data processing, feature extraction, and structured patient record management. A responsive Angular frontend provides an intuitive interface with role-based authentication, consent-driven privacy controls, and interactive data visualization dashboards for better clinical insights.\n\nThe application emphasizes data security, scalability, and real-world healthcare compliance, making it suitable for early screening use cases and future AI/ML integration in medical diagnostics.",
        image: "https://postimg.cc/QF35gxYT",
        github: "https://github.com/Yashwant-92",
      },
      {
        title: "Hospital Management System Integrating ICD-10 Code",
        description:
          "A scalable hospital workflow management application built with Spring Boot REST APIs and Hibernate, enabling secure handling of patient, doctor, and administrative data. The system implements role-based access control (RBAC), optimized backend performance for multi-user environments, and robust logging for reliability and compliance, with an Angular frontend for seamless user interaction.",
        image: "https://postimg.cc/DWByyDfb",
        github: "https://github.com/Yashwant-92",
      },
      {
        title: "SAMSTRACK – Student Attendance Management System",
        description:
          "A real-time student attendance tracking system built with Spring Boot and MySQL, providing efficient and reliable backend services for managing attendance data. The platform improves institutional workflow efficiency and integrates seamlessly with an Angular frontend for smooth user experience.",
        image: "https://postimg.cc/Mn0pgHhD",
        github: "https://github.com/Yashwant-92",
      },
      {
        title: "EduAccess: Secure Learning Management System",
        description:
          "A secure Learning Management System built with Spring Boot and Spring Security, implementing role-based access control for Admin, Teacher, Student, and Alumni. The platform allows teachers to upload course videos and notes, manage attendance, and generate downloadable attendance PDFs, while students access subject-wise learning content and dashboards. Admins maintain full control over user approvals, course access, and content visibility, ensuring that only enrolled students can access authorized materials. An alumni module keeps users informed about alumni updates and newly launched courses.",
        image: "https://postimg.cc/KKJvvVcz",
        github: "https://github.com/Yashwant-92",
      },
    ],
    []
  );

  const certificates: CertificateItem[] = useMemo(
    () => [
      {
        title: "Java Programming",
        image: "https://i.postimg.cc/CLz4x6KJ/1.jpg",
        issuer: "Coursera",
      },
      {
        title: "Web Development",
        image: "https://i.postimg.cc/3wHj98Fb/3.jpg",
        issuer: "Coursera",
      },
      {
        title: "Java Testing",
        image: "https://i.postimg.cc/152rncnS/2.jpg",
        issuer: "Coursera",
      },
      {
        title: "IBM Full Stack software developer",
        image: "https://i.postimg.cc/pdYf6w0V/4.jpg",
        issuer: "Coursera",
      },
      {
        title: "GCC-TBC (English -30)Typing",
        image: "https://i.postimg.cc/GmDJk8Gy/5.jpg",
        issuer: "MSCE Pune",
      },
      {
        title: "UI/UX Design",
        image: "https://i.postimg.cc/gJzVFg5V/6.jpg",
        issuer: "Internshala",
      },
      {
        title: "TCS iON career edge",
        image: "https://i.postimg.cc/tTBhXhQL/7.jpg",
        issuer: "TCS iON",
      },
    ],
    []
  );

  const skillItems = useMemo(
    () =>
      [
        { name: "Java (Core & Advance)", icon: "https://cdn.simpleicons.org/java/10b981" },
        { name: "JavaScript", icon: "https://cdn.simpleicons.org/javascript/10b981" },
        { name: "TypeScript", icon: "https://cdn.simpleicons.org/typescript/10b981" },
        { name: "HTML", icon: "https://cdn.simpleicons.org/html5/10b981" },
        { name: "CSS", icon: "https://cdn.simpleicons.org/css3/10b981" },
        { name: "Angular", icon: "https://cdn.simpleicons.org/angular/10b981" },
        { name: "Bootstrap", icon: "https://cdn.simpleicons.org/bootstrap/10b981" },
        { name: "Spring Boot", icon: "https://cdn.simpleicons.org/springboot/10b981" },
        { name: "Spring Security", icon: "https://cdn.simpleicons.org/springsecurity/10b981" },
        { name: "RESTful APIs", icon: "https://cdn.simpleicons.org/fastapi/10b981" },
        { name: "MySQL", icon: "https://cdn.simpleicons.org/mysql/10b981" },
        { name: "Hibernate", icon: "https://cdn.simpleicons.org/hibernate/10b981" },
        { name: "Git", icon: "https://cdn.simpleicons.org/git/10b981" },
        { name: "GitHub", icon: "https://cdn.simpleicons.org/github/10b981" },
        { name: "Maven", icon: "https://cdn.simpleicons.org/apachemaven/10b981" },
        { name: "Eclipse", icon: "https://cdn.simpleicons.org/eclipseide/10b981" },
        { name: "VS Code", icon: "https://cdn.simpleicons.org/visualstudiocode/10b981" },
        { name: "Render", icon: "https://cdn.simpleicons.org/render/10b981" },
        { name: "Hostinger", icon: "https://cdn.simpleicons.org/hostinger/10b981" },
        { name: "OpenAI", icon: "https://cdn.simpleicons.org/openai/10b981" },
      ] as const,
    []
  );

  const scrolled = useScrolled(40);
  useRevealOnScroll();

  const [loadingDone, setLoadingDone] = useState(false);

  const roles = useMemo(
    () => [
      "Web Developer",
      "AI Technophile",
      "Vibe Coder",
      "Java Full Stack Developer",
      "Spring Boot Developer",
    ],
    []
  );
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRoleIndex((i) => (i + 1) % roles.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [roles.length]);

  const [active, setActive] = useState<NavKey>("home");

  // highlight active section (simple + stable)
  useEffect(() => {
    const ids: NavKey[] = [
      "home",
      "about",
      "academics",
      "skills",
      "projects",
      "certificates",
      "contact",
    ];

    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (nodes.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) setActive(visible.target.id as NavKey);
      },
      { threshold: [0.25, 0.4, 0.6] }
    );

    for (const n of nodes) io.observe(n);
    return () => io.disconnect();
  }, []);

  const [openCert, setOpenCert] = useState<CertificateItem | null>(null);

  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>(
    {}
  );

  const heroIntro =
    "🚀 Java Full Stack Developer with with hands-on experience in building scalable, secure, and high-performance web applications. I turn complex ideas into clean, efficient code using Java, Spring Boot, Angular, and MySQL. Passionate about microservices, REST APIs, and modern UI integration, I love crafting solutions that are fast ⚡, reliable 🔒, and user-friendly 🎯.";

  // fallback for project images (because postimg.cc links are usually HTML pages, not direct images)
  const projectImageFallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#0b1220" offset="0"/>
            <stop stop-color="#0f172a" offset="0.5"/>
            <stop stop-color="#052e2b" offset="1"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="50%" fill="#a7f3d0" font-family="Arial" font-size="34" text-anchor="middle">
          Project Preview
        </text>
        <text x="50%" y="56%" fill="#94a3b8" font-family="Arial" font-size="18" text-anchor="middle">
          (If image link is not a direct image URL)
        </text>
      </svg>
    `);

  const skillIconFallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <rect width="100%" height="100%" rx="14" ry="14" fill="#0b1220"/>
        <path d="M20 44l8-24h8l8 24h-6l-1.6-5H27.6L26 44h-6Zm9.4-10h9.2L34 24.8 29.4 34Z" fill="#a7f3d0"/>
      </svg>
    `);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!loadingDone && <LoadingScreen onDone={() => setLoadingDone(true)} />}

      {/* NAV */}
      <div
        className={cn(
          "fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-500",
          scrolled ? "top-4" : "bottom-4"
        )}
      >
        <nav className="rounded-full border border-emerald-400/15 bg-slate-900/50 px-2 py-2 shadow-[0_0_0_1px_rgba(16,185,129,0.08)] backdrop-blur">
          <ul className="flex flex-wrap items-center justify-center gap-1">
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(item.key);
                    scrollToId(item.key);
                  }}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs sm:text-sm transition active:scale-[0.97]",
                    active === item.key
                      ? "bg-emerald-400/15 text-emerald-200"
                      : "text-slate-200 hover:bg-slate-800/60 hover:text-slate-50"
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* PAGE */}
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
        {/* HOME */}
        <section
          id="home"
          data-reveal
          className="reveal-hidden relative rounded-3xl border border-emerald-400/10 bg-slate-900/20 p-6 sm:p-10"
        >
          <div className="grid items-center gap-8 md:grid-cols-[1.35fr_0.65fr]">
            <div>
              <p className="text-xs tracking-wider text-slate-400">
                PORTFOLIO
              </p>

              <h1
                className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, Arial" }}
              >
                Hi, I am{" "}
                <span className="text-emerald-300">Yashwant</span>
              </h1>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-slate-400">I am</span>
                <span
                  key={roleIndex}
                  className="flip-in inline-flex rounded-xl border border-emerald-400/15 bg-slate-950/40 px-3 py-1.5 text-sm text-emerald-200"
                  style={{
                    fontFamily:
                      "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {roles[roleIndex]}
                </span>
              </div>

              <p
                className="mt-5 max-w-2xl text-balance text-sm leading-6 text-slate-200 sm:text-base"
                style={{ fontFamily: "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, Arial" }}
              >
                Building clean, scalable products with a strong backend mindset and modern UI.
                I focus on performance, security, and delightful user experience.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="mailto:yashwantgadkar@gmail.com"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                >
                  yashwantgadkar@gmail.com
                </a>
                <button
                  type="button"
                  onClick={() => scrollToId("projects")}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-400/25 bg-slate-900/30 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/50 hover:bg-slate-900/60 active:scale-[0.98]"
                >
                  View Projects
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[280px]">
              <div className="conic-ring rounded-full bg-slate-950/40 p-1">
                <div className="rounded-full bg-slate-950/60 p-2">
                  <div className="relative aspect-square overflow-hidden rounded-full border border-emerald-400/10">
                    <Image
                      src="https://i.postimg.cc/XJb2ZKPq/Whats-App-Image-2025-03-25-at-7-23-16-PM.jpg"
                      alt="Yashwant"
                      fill
                      sizes="(max-width: 768px) 260px, 300px"
                      className="object-cover"
                      priority
                      quality={90}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          data-reveal
          className="reveal-hidden mt-10 rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 sm:p-10"
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              About
            </h2>
            <p
              className="text-balance text-sm leading-7 text-slate-200 sm:text-base"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              {heroIntro}
            </p>

            <div className="mt-2 flex flex-wrap gap-3">
              <IconLink
                href="mailto:yashwantgadkar@gmail.com"
                label="Email"
                iconUrl="https://cdn.simpleicons.org/gmail/10b981"
              />
              <IconLink
                href="https://github.com/Yashwant-92"
                label="GitHub"
                iconUrl="https://cdn.simpleicons.org/github/10b981"
              />
              <IconLink
                href="http://www.linkedin.com/in/yashwant-gadkar-85361a220"
                label="LinkedIn"
                icon={
                  <Linkedin
                    aria-hidden="true"
                    className="h-5 w-5 text-emerald-300/90 transition group-hover:text-emerald-200"
                  />
                }
              />
              <IconLink
                href="https://www.instagram.com/yashwanttt_gadkar_0304/"
                label="Instagram"
                iconUrl="https://cdn.simpleicons.org/instagram/10b981"
              />
            </div>
          </div>
        </section>

        {/* ACADEMICS */}
        <section id="academics" data-reveal className="reveal-hidden mt-10">
          <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Academics
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {academics.map((a) => (
                <div
                  key={`${a.degree}-${a.year}`}
                  className="group rounded-2xl border border-emerald-400/10 bg-slate-950/30 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/35 hover:bg-slate-950/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-50">
                        {a.degree}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{a.year}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                      {a.score}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">
                    {a.institution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" data-reveal className="reveal-hidden mt-10">
          <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Skills
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {skillItems.map((s) => (
                <div
                  key={s.name}
                  className={cn(
                    "rounded-2xl border border-emerald-400/10 bg-slate-950/30 px-4 py-4 transition",
                    "hover:scale-[1.02] hover:border-emerald-400/35 hover:bg-slate-950/45 active:scale-[0.99]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.icon}
                      alt=""
                      className="h-8 w-8"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = skillIconFallback;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-50">
                        {s.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" data-reveal className="reveal-hidden mt-10">
          <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Projects
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-5">
              {projects.map((p, idx) => {
                const expanded = Boolean(expandedProjects[idx]);
                const short =
                  p.description.length > 240
                    ? p.description.slice(0, 240).trim() + "…"
                    : p.description;

                return (
                  <article
                    key={p.title}
                    className="rounded-2xl border border-emerald-400/10 bg-slate-950/30 p-5 transition hover:border-emerald-400/30 hover:bg-slate-950/45"
                  >
                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <div className="overflow-hidden rounded-2xl border border-emerald-400/10 bg-slate-900/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/postimg?url=${encodeURIComponent(p.image)}`}
                          alt={p.title}
                          className="block h-[140px] w-full bg-slate-950/40 object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.src = projectImageFallback;
                          }}
                        />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-slate-50">
                          {p.title}
                        </h3>

                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">
                          {expanded ? p.description : short}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProjects((prev) => ({
                                ...prev,
                                [idx]: !prev[idx],
                              }))
                            }
                            className="rounded-xl border border-emerald-400/20 bg-slate-900/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400/45 hover:bg-slate-900/60 active:scale-[0.98]"
                          >
                            {expanded ? "Read less" : "Read more"}
                          </button>

                          <a
                            href={p.github}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                          >
                            GitHub
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CERTIFICATES */}
        <section id="certificates" data-reveal className="reveal-hidden mt-10">
          <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Certificates
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((c) => (
                <button
                  key={c.title}
                  type="button"
                  onClick={() => setOpenCert(c)}
                  className="group text-left"
                >
                  <div className="rounded-2xl border border-emerald-400/10 bg-slate-950/30 p-3 transition hover:scale-[1.01] hover:border-emerald-400/35 hover:bg-slate-950/45 active:scale-[0.99]">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-emerald-400/10">
                      <Image
                        src={c.image}
                        alt={c.title}
                        fill
                        sizes="(max-width: 1024px) 90vw, 380px"
                        className="object-cover"
                        quality={90}
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-slate-50">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400">{c.issuer}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* certificate modal */}
          {openCert && (
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Certificate preview"
              onClick={() => setOpenCert(null)}
            >
              <div
                className="w-full max-w-4xl overflow-hidden rounded-2xl border border-emerald-400/20 bg-slate-950"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-emerald-400/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      {openCert.title}
                    </p>
                    <p className="text-xs text-slate-400">{openCert.issuer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCert(null)}
                    className="rounded-xl border border-emerald-400/20 bg-slate-900/30 px-3 py-2 text-sm text-slate-100 transition hover:border-emerald-400/45 hover:bg-slate-900/60"
                  >
                    Close
                  </button>
                </div>

                <div className="relative aspect-[16/10] w-full bg-slate-950">
                  <Image
                    src={openCert.image}
                    alt={openCert.title}
                    fill
                    sizes="(max-width: 1200px) 95vw, 1100px"
                    className="object-contain"
                    quality={90}
                    priority
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CONTACT */}
        <section id="contact" data-reveal className="reveal-hidden mt-10">
          <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Contact
            </h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ContactForm />

              <div className="rounded-2xl border border-emerald-400/10 bg-slate-950/30 p-5">
                <p className="text-sm font-semibold text-slate-50">
                  Connect with me
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Let's build something impactful.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <IconLink
                    href="https://www.instagram.com/yashwanttt_gadkar_0304/"
                    label="Instagram"
                    iconUrl="https://cdn.simpleicons.org/instagram/10b981"
                  />
                  <IconLink
                    href="https://github.com/Yashwant-92"
                    label="GitHub"
                    iconUrl="https://cdn.simpleicons.org/github/10b981"
                  />
                  <IconLink
                    href="http://www.linkedin.com/in/yashwant-gadkar-85361a220"
                    label="LinkedIn"
                    icon={
                      <Linkedin
                        aria-hidden="true"
                        className="h-5 w-5 text-emerald-300/90 transition group-hover:text-emerald-200"
                      />
                    }
                  />
                  <IconLink
                    href="mailto:yashwantgadkar@gmail.com"
                    label="Email"
                    iconUrl="https://cdn.simpleicons.org/gmail/10b981"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER (shows at the end) */}
        <footer data-reveal className="reveal-hidden mt-10 pb-6">
          <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/10 p-6 text-center">
            <p className="text-sm text-slate-300">
              © {new Date().getFullYear()} Yashwant Gadkar • Built with Next.js
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio Contact from ${name || "Someone"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:yashwantgadkar@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-emerald-400/10 bg-slate-950/30 p-5"
    >
      <p className="text-sm font-semibold text-slate-50">Send a message</p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-300">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-emerald-400/10 bg-slate-950/60 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-400/45"
            placeholder="Enter your name"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-300">Your email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="rounded-xl border border-emerald-400/10 bg-slate-950/60 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-400/45"
            placeholder="Enter your email"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-300">Your message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-y rounded-xl border border-emerald-400/10 bg-slate-950/60 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-400/45"
            placeholder="Write your message..."
          />
        </label>

        <button
          type="submit"
          className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          Send
        </button>

        <p className="text-xs text-slate-500">
          This uses your email app (mailto) to send the message.
        </p>
      </div>
    </form>
  );
}
