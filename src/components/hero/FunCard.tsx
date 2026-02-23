import { motion } from "framer-motion";
import { AnimatedLink } from "../AnimatedLink";
import { useNavigateToSection } from "../../hooks/useNavigateToSection";

export default function FunCard() {
  const navigateTo = useNavigateToSection();

  return (
    <div className="md:grid grid-cols-2 md:gap-2">
      <div className="-mx-6 md:mx-2 text-xs md:text-sm lg:text-base text-center justify-center my-auto">
        I like climbing rocks 🧗‍♂️, playing chess ♟️ and taking pictures 📸, see
        some photos I've taken{" "}
        <AnimatedLink onClick={() => navigateTo("gallery")}>here</AnimatedLink>!
      </div>
      <div>
        <motion.img
          src="hero/rocks.webp"
          className="rounded-md mt-4 md:my-2 max-h-[200px] md:max-h-[300px] mx-auto"
        />
        <p className="text-[10.5px] md:text-xs text-center mt-1">
          Kananskis, Alberta 🇨🇦
        </p>
      </div>
    </div>
  );
}
