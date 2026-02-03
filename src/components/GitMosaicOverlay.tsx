import { motion } from "framer-motion";
import StyledGitMosaic from "./StyledGitMosaic";

export default function GitMosaicOverlay() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center pt-10"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 5 }}
    >
      <StyledGitMosaic />
    </motion.div>
  );
}
