function ChilliIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M14 8c3-2 6-1 7 2 4-1 8 1 9 6 2 10-4 22-14 24-6 1-11-3-11-9 0-9 4-19 9-23Z"
        fill="var(--color-chilli)"
      />
      <path d="M14 8c-2-3-1-6 2-7" stroke="var(--color-leaf)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function TurmericRootIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M10 20c-3 3-4 8-1 11 2 2 5 2 7 0 1 3 4 5 7 4 4-1 6-5 5-9 3 0 6-2 6-6 0-5-4-8-9-7-1-3-4-5-7-4-4 1-6 5-4 9-2 0-3 1-4 2Z"
        fill="var(--color-turmeric)"
      />
    </svg>
  );
}

function PeppercornsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="14" cy="28" r="7" fill="var(--color-pepper)" />
      <circle cx="27" cy="20" r="8.5" fill="var(--color-pepper)" />
      <circle cx="36" cy="33" r="6" fill="var(--color-pepper)" />
      <circle cx="12" cy="26" r="1.6" fill="white" opacity="0.25" />
      <circle cx="24" cy="17" r="2" fill="white" opacity="0.25" />
    </svg>
  );
}

function CorianderSeedsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <ellipse cx="16" cy="22" rx="6" ry="7.5" fill="var(--color-coriander)" transform="rotate(-15 16 22)" />
      <ellipse cx="29" cy="16" rx="6" ry="7.5" fill="var(--color-coriander)" transform="rotate(10 29 16)" />
      <ellipse cx="30" cy="32" rx="6" ry="7.5" fill="var(--color-coriander)" transform="rotate(25 30 32)" />
      <path d="M16 16v-4M29 8v-4M30 24v-4" stroke="var(--color-leaf)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StarAniseIcon({ className }: { className?: string }) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x = 24 + Math.cos(angle) * 18;
    const y = 24 + Math.sin(angle) * 18;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {points.map((p, i) => (
        <path key={i} d={`M24 24L${p}`} stroke="var(--color-turmeric)" strokeWidth="6" strokeLinecap="round" />
      ))}
      <circle cx="24" cy="24" r="6" fill="var(--color-chilli)" />
    </svg>
  );
}

interface FloatingIcon {
  Icon: (props: { className?: string }) => React.ReactNode;
  position: string;
  size: string;
  duration: string;
  delay: string;
  rotate: string;
  opacity: string;
}

const ICONS: FloatingIcon[] = [
  { Icon: ChilliIcon, position: "left-[2%] top-[6%]", size: "size-16", duration: "7s", delay: "0s", rotate: "-8deg", opacity: "opacity-80" },
  { Icon: TurmericRootIcon, position: "right-[4%] top-[10%]", size: "size-20", duration: "8.5s", delay: "0.6s", rotate: "6deg", opacity: "opacity-70" },
  { Icon: PeppercornsIcon, position: "left-[8%] bottom-[8%]", size: "size-14", duration: "6.5s", delay: "1.1s", rotate: "-5deg", opacity: "opacity-75" },
  { Icon: CorianderSeedsIcon, position: "right-[2%] bottom-[14%]", size: "size-16", duration: "7.5s", delay: "0.3s", rotate: "10deg", opacity: "opacity-70" },
  { Icon: StarAniseIcon, position: "left-[45%] top-[2%]", size: "size-12", duration: "9s", delay: "0.8s", rotate: "-3deg", opacity: "opacity-60" },
];

/**
 * Purely decorative floating raw-spice illustrations for the Spices section (client request: "the
 * Spices section looks very bland in desktop view"). Desktop-only (`hidden lg:block` on the
 * wrapper) — there's no room for ambient decoration once the layout stacks to a single column on
 * a phone screen, and it would compete with the actual product cards for attention there.
 * `aria-hidden` + `pointer-events-none` throughout: purely visual, never intercepts a click or
 * gets announced to a screen reader. Colours are the existing family-accent tokens
 * (--color-chilli/turmeric/pepper/coriander/leaf, CLAUDE.md §5.2) — no new hex literals.
 */
export function FloatingSpiceVectors() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block">
      {ICONS.map(({ Icon, position, size, duration, delay, rotate, opacity }, i) => (
        <div
          key={i}
          className={`absolute ${position} ${size} ${opacity}`}
          style={{
            animation: `float-spice ${duration} ease-in-out ${delay} infinite`,
            ["--float-rotate" as string]: rotate,
          }}
        >
          <Icon className="size-full drop-shadow-sm" />
        </div>
      ))}
    </div>
  );
}
