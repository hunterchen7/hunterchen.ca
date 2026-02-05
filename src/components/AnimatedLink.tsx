interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedLink({ href, children, className = "" }: AnimatedLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-block ${className}`}
    >
      <span className="text-fuchsia-300/80 group-hover:text-fuchsia-200 transition-colors">
        {children}
      </span>
      <span className="block h-0 max-w-0 border-b border-fuchsia-300/60 transition-all duration-200 group-hover:max-w-full group-hover:border-fuchsia-200" />
    </a>
  );
}
