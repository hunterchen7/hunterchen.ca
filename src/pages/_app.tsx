import { type AppType } from "next/app";
import { JetBrains_Mono } from "next/font/google";

// Canvas styles first, then our overrides
import "@hunterchen/canvas/styles.css";
import "../styles/globals.css";
import { PerformanceProvider } from "@hunterchen/canvas";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <PerformanceProvider>
      <main className={`${jetbrainsMono.variable} font-mono`}>
        <Component {...pageProps} />
      </main>
    </PerformanceProvider>
  );
};

export default MyApp;
