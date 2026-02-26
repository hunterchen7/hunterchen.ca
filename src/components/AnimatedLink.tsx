interface AnimatedLinkProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  stopPropagation?: boolean;
}

export function AnimatedLink({
  href,
  onClick,
  children,
  className = "",
  textClassName,
  stopPropagation = true,
}: AnimatedLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <a
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      className={`group inline ${className}`}
    >
      <span
        className={`animated-underline ${textClassName ?? "text-fuchsia-300/80"} group-hover:text-fuchsia-200`}
        style={{
          backgroundImage: "linear-gradient(currentColor, currentColor)",
          backgroundPosition: "0 100%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "0% 1px",
          paddingBottom: 1,
          transition: "background-size 0.2s ease, color 0.2s",
        }}
      >
        {children}
      </span>
    </a>
  );
}
