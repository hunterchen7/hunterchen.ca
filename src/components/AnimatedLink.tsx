interface AnimatedLinkProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  stopPropagation?: boolean;
}

export function AnimatedLink({ href, onClick, children, className = "", textClassName, stopPropagation = true }: AnimatedLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <a
      href={href ?? "#"}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      className={`group inline-block ${className}`}
    >
      <span className={`${textClassName ?? "text-fuchsia-300/80"} group-hover:text-fuchsia-200 transition-colors`}>
        {children}
      </span>
      <span className="block h-0 max-w-0 border-b border-fuchsia-300/60 transition-all duration-200 group-hover:max-w-full group-hover:border-fuchsia-200" />
    </a>
  );
}
