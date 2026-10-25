"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatPrice, PRICING } from "~/lib/pricing";
import Reveal from "../Reveal";

/** Opens the sign-in modal, then drops the visitor straight into "create a project". */
function PostIdeaButton({ className = "btn-primary", children = "Post your idea" }: { className?: string; children?: ReactNode }) {
  return (
    <SignInButton mode="modal" forceRedirectUrl="/?create=true">
      <button type="button" className={className}>
        {children}
      </button>
    </SignInButton>
  );
}

const Check = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------ hero */

function Avatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-[11px] font-bold text-accent-blue ${className}`}
    >
      {initials}
    </span>
  );
}

function MemberNode({ initials, title, caption }: { initials: string; title: string; caption: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dark-subtle bg-dark-card px-4 py-3">
      <Avatar initials={initials} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-fg">{title}</p>
        <p className="text-[11px] text-success">{caption}</p>
      </div>
    </div>
  );
}

function OpenSpotNode({ title, caption, highlighted = false }: { title: string; caption: string; highlighted?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        highlighted
          ? "border-accent-blue bg-accent-blue/10 shadow-[0_0_30px_-8px_var(--accent)]"
          : "border-dashed border-dark bg-transparent"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          highlighted ? "border-accent-blue text-accent-blue" : "border-dark text-fg-secondary"
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-fg">{title}</p>
        <p className={`text-[11px] ${highlighted ? "text-accent-blue" : "text-dark-muted"}`}>{caption}</p>
      </div>
    </div>
  );
}

function IdeaCard() {
  return (
    <div className="rounded-2xl border border-dark bg-dark-card p-5 text-left shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-accent-blue/15 px-2 py-0.5 text-[10px] font-semibold text-accent-blue">The idea</span>
        <span className="text-[10px] text-dark-muted">Posted today</span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-fg">Weekend recipe app</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-fg-secondary">
        A simple app for planning meals with friends. Needs a developer and a marketer to launch.
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-dark-subtle pt-3">
        <span className="text-[12px] text-fg-secondary">2 of 4 spots filled</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1 w-5 rounded-full bg-accent-blue" />
          <span className="h-1 w-5 rounded-full bg-accent-blue" />
          <span className="h-1 w-5 animate-pulse-soft rounded-full bg-accent-blue/40" />
          <span className="h-1 w-5 rounded-full bg-dark-tertiary" />
        </span>
      </div>
    </div>
  );
}

function Constellation() {
  return (
    <>
      {/* Phones: simple stack */}
      <div className="mx-auto mt-12 max-w-sm space-y-3 md:hidden">
        <IdeaCard />
        <MemberNode initials="LB" title="UI Designer" caption="Joined" />
        <MemberNode initials="EK" title="UX Research" caption="Joined" />
        <OpenSpotNode title="Developer" caption="1 spot open" />
        <OpenSpotNode title="Marketer" caption="Could be you" highlighted />
      </div>

      {/* Desktop: the idea in the middle, people and open roles connecting to it */}
      <div className="relative mx-auto mt-16 hidden h-[330px] max-w-4xl md:block">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 28%, transparent), transparent)" }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 330" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M235 52 C300 52 285 150 340 150" stroke="var(--line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <path d="M665 52 C600 52 615 150 560 150" stroke="var(--line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <path
            d="M235 278 C300 278 285 190 340 190"
            stroke="var(--line)"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            className="animate-line-flow"
          />
          <path
            d="M665 278 C600 278 615 190 560 190"
            stroke="var(--accent)"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            className="animate-line-flow"
          />
        </svg>

        <div className="absolute left-0 top-3 w-[235px] animate-float-soft">
          <MemberNode initials="LB" title="Laura · UI Designer" caption="Joined the team" />
        </div>
        <div className="absolute right-0 top-3 w-[235px] animate-float-soft [animation-delay:-2s]">
          <MemberNode initials="EK" title="Elina · UX Researcher" caption="Joined the team" />
        </div>
        <div className="absolute bottom-3 left-0 w-[235px]">
          <OpenSpotNode title="Developer" caption="1 spot open" />
        </div>
        <div className="absolute bottom-3 right-0 w-[235px] animate-float-soft [animation-delay:-4s]">
          <OpenSpotNode title="Marketer" caption="This spot could be yours" highlighted />
        </div>
        <div className="absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2">
          <IdeaCard />
        </div>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="force-dark relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:pt-24">
        <Reveal>
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-dark-subtle bg-dark-card px-3.5 py-1.5 text-[11px] text-fg-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
            Free to start. Posting and applying cost nothing.
          </p>
          <h1 className="mx-auto mt-7 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight text-fg sm:text-7xl">
            Every idea needs a team.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fg-secondary sm:text-lg">
            Kvelpo is where people post what they&apos;re building and find the people to build it with. Designers, developers,
            marketers, writers: anyone with a skill and an idea.
          </p>
          <div className="mx-auto mt-9 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <PostIdeaButton />
            <Link href="/projects" className="btn-secondary">
              Find a project
            </Link>
          </div>
        </Reveal>

        <Constellation />
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- skills */

const SKILL_ROW_ONE: { label: string; tone: "solid" | "accent" | "outline" }[] = [
  { label: "Designers", tone: "solid" },
  { label: "Developers", tone: "accent" },
  { label: "Marketers", tone: "outline" },
  { label: "Writers", tone: "solid" },
  { label: "Video editors", tone: "accent" },
  { label: "Photographers", tone: "outline" },
];

const SKILL_ROW_TWO: { label: string; tone: "solid" | "accent" | "outline" }[] = [
  { label: "Researchers", tone: "accent" },
  { label: "Founders", tone: "outline" },
  { label: "Illustrators", tone: "solid" },
  { label: "Copywriters", tone: "accent" },
  { label: "Engineers", tone: "outline" },
  { label: "Musicians", tone: "solid" },
];

const toneClass = {
  solid: "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
  accent: "bg-accent-blue/12 text-accent-blue",
  outline: "border border-dark-subtle text-fg",
} as const;

function MarqueeRow({ items, reverse = false }: { items: typeof SKILL_ROW_ONE; reverse?: boolean }) {
  // Two copies side by side; the animation slides exactly one copy's width.
  const copies = [0, 1];
  return (
    <div className="flex overflow-hidden">
      <div className={`flex shrink-0 gap-3 pr-3 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {copies.map((copy) => (
          <div key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1}>
            {items.map((item) => (
              <span
                key={`${copy}-${item.label}`}
                className={`whitespace-nowrap rounded-full px-6 py-3 text-xl font-semibold sm:px-8 sm:py-4 sm:text-3xl ${toneClass[item.tone]}`}
              >
                {item.label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Skills() {
  return (
    <section className="py-16 sm:py-20">
      <Reveal>
        <p className="mb-8 text-center text-sm text-fg-secondary">Find the skills your idea is missing.</p>
        <div className="space-y-3">
          <MarqueeRow items={SKILL_ROW_ONE} />
          <MarqueeRow items={SKILL_ROW_TWO} reverse />
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- audience */

function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal className="flex min-h-[340px] flex-col rounded-3xl border border-dark-subtle bg-dark-card p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dark-muted">For creators</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg">Have an idea? Post it and pick your team.</h2>
          <ul className="mt-5 space-y-2 text-sm text-fg-secondary">
            {["List the roles you need and how many people", "Review applicants and choose who joins", "Get a team chat the moment someone joins"].map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="text-success">
                  <Check />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <PostIdeaButton>Post a project</PostIdeaButton>
          </div>
        </Reveal>

        <Reveal className="flex min-h-[340px] flex-col rounded-3xl bg-accent-blue p-8 text-accent-fg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">For builders</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight">Have a skill? Join something worth building.</h2>
          <ul className="mt-5 space-y-2 text-sm text-white/85">
            {["Browse projects by the skills they need", "Apply with a short message", "Hear back from the person running it"].map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <Link href="/projects" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-black transition hover:-translate-y-0.5">
              Find a project
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- how it works */

function HowItWorks() {
  const steps = [
    { n: "1", title: "Post your idea", body: "Describe what you're building and list the roles you need. It takes about two minutes." },
    { n: "2", title: "Pick your team", body: "People apply with a short message. You look at their profiles and choose who joins." },
    { n: "3", title: "Build together", body: "Your team gets a shared chat right away, so the work can start the same day." },
  ];

  return (
    <section id="how-it-works" className="bg-dark-secondary py-20">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">How it works</h2>
          <p className="max-w-[16rem] text-sm text-fg-secondary">From idea to team in three steps. No experience needed.</p>
        </Reveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <Reveal key={step.n} className="border-t border-dark pt-5">
              <p className="text-7xl font-bold leading-none text-dark-muted/50">{step.n}</p>
              <h3 className="mt-6 text-lg font-semibold text-fg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- bento */

const BAR_HEIGHTS = [28, 40, 34, 52, 46, 70, 100];

function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <h2 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">Everything a new team needs</h2>
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Reveal className="flex flex-col rounded-3xl bg-dark-secondary p-7 md:col-span-2">
          <h3 className="text-lg font-semibold text-fg">Team chat, built in</h3>
          <p className="mt-1.5 max-w-md text-sm text-fg-secondary">
            Every project gets its own chat the moment someone joins. No Discord server, no group chat full of strangers.
          </p>
          <div className="mt-6 space-y-3">
            <div>
              <p className="mb-1 text-[11px] text-dark-muted">Sara K.</p>
              <span className="inline-block rounded-2xl rounded-bl-md bg-dark-primary px-3.5 py-2 text-sm text-fg">
                Just pushed the new onboarding screens
              </span>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[11px] text-dark-muted">You</p>
              <span className="inline-block rounded-2xl rounded-br-md bg-accent-blue px-3.5 py-2 text-sm text-accent-fg">
                Looks great, testing now
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal className="rounded-3xl bg-dark-secondary p-7">
          <h3 className="text-lg font-semibold text-fg">Roles, not job posts</h3>
          <p className="mt-1.5 text-sm text-fg-secondary">Say exactly who you need and how many.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "Designer · 2 open", solid: true },
              { label: "Developer · 1 open", solid: false },
              { label: "Marketer · 1 open", solid: false },
              { label: "Writer · 1 open", solid: false },
            ].map((chip) => (
              <span
                key={chip.label}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  chip.solid ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]" : "border border-dark-subtle bg-dark-primary text-fg"
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal className="rounded-3xl bg-dark-secondary p-7">
          <h3 className="text-lg font-semibold text-fg">See who&apos;s interested</h3>
          <p className="mt-1.5 text-sm text-fg-secondary">Insights show how many people viewed your project.</p>
          <div className="mt-6 flex h-24 items-end gap-2" aria-hidden="true">
            {BAR_HEIGHTS.map((height, index) => (
              <span
                key={index}
                className={`animate-rise flex-1 rounded-md ${index === BAR_HEIGHTS.length - 1 ? "bg-accent-blue" : "bg-accent-blue/25"}`}
                style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }}
              />
            ))}
          </div>
        </Reveal>

        <Reveal className="rounded-3xl bg-dark-secondary p-7 md:col-span-2">
          <h3 className="text-lg font-semibold text-fg">Boost when it matters</h3>
          <p className="mt-1.5 max-w-md text-sm text-fg-secondary">
            Put your project at the top of Explore for {PRICING.boostDays} days with a Featured label. {formatPrice(PRICING.boost)}, one time.
          </p>
          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dark-subtle bg-dark-primary px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">Weekend recipe app</p>
              <p className="text-xs text-dark-muted">2 roles open · Posted today</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-blue/12 px-3 py-1 text-xs font-semibold text-accent-blue">
              Featured
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
              </svg>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- pricing */

function PricingStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <Reveal className="flex flex-col gap-5 rounded-3xl border border-dark-subtle p-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Free to start.</h2>
          <p className="mt-1 text-sm text-fg-secondary">
            Pro is {formatPrice(PRICING.proMonthly)} a month when you need more. Boost any project for {formatPrice(PRICING.boost)}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/profile/subscription" className="btn-secondary !px-5 !py-2.5 text-sm">
            See pricing
          </Link>
          <SignInButton mode="modal">
            <button type="button" className="btn-primary !px-5 !py-2.5 text-sm">
              Get started
            </button>
          </SignInButton>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- final CTA */

function FinalCta() {
  return (
    <section className="bg-accent-blue px-4 py-24 text-center text-accent-fg">
      <Reveal>
        <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">No idea is impossible.</h2>
        <p className="mt-4 text-base text-white/80">Post yours today. It&apos;s free.</p>
        <div className="mt-8">
          <SignInButton mode="modal" forceRedirectUrl="/?create=true">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-black transition hover:-translate-y-0.5"
            >
              Post your idea
            </button>
          </SignInButton>
        </div>
      </Reveal>
    </section>
  );
}

export default function Landing() {
  return (
    <main className="overflow-x-hidden bg-dark-primary text-fg">
      <Hero />
      <Skills />
      <Audience />
      <HowItWorks />
      <Bento />
      <PricingStrip />
      <FinalCta />
    </main>
  );
}
