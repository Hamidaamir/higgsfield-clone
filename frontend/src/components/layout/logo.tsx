export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 9.5c0-2.8 2.2-5 5-5 1.9 0 3.5 1 4.4 2.5L12 9.5a2.5 2.5 0 1 0 0 5l1.9 2.5A5 5 0 0 1 4.5 14.5v-5Z"
        fill="currentColor"
      />
      <path
        d="M19.5 14.5c0 2.8-2.2 5-5 5-1.9 0-3.5-1-4.4-2.5L12 14.5a2.5 2.5 0 1 0 0-5l-1.9-2.5A5 5 0 0 1 19.5 9.5v5Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}
