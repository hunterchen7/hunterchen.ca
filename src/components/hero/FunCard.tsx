import { motion } from "framer-motion";
import { AnimatedLink } from "../AnimatedLink";
import { useNavigateToSection } from "../../hooks/useNavigateToSection";

export default function FunCard() {
  const navigateTo = useNavigateToSection();

  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_54%] gap-3 md:gap-4 items-start md:items-stretch">
      <div className="order-2 md:order-1 md:self-start text-[10px] md:text-sm lg:text-base leading-relaxed text-left">
        If I'm not on my computer, you'll probably find me climbing rocks,
        playing chess, or{" "}
        <AnimatedLink onClick={() => navigateTo("gallery")}>
          taking pictures
        </AnimatedLink>
        .
      </div>
      <div className="md:order-2 relative overflow-hidden rounded-lg border border-fuchsia-200/15 shadow-[0_10px_24px_rgba(0,0,0,0.24)] md:h-full">
        <motion.img
          src="hero/rocks.webp"
          className="h-[130px] md:h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#160b20]/95 via-[#160b20]/55 to-transparent pr-1 py-1">
          <p className="text-[8px] md:text-xs text-fuchsia-100/90 text-right">
            Kananaskis, Alberta 🇨🇦
          </p>
        </div>
      </div>
    </div>
  );
}
