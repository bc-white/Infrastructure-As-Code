import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { ThemeContext, resolveToken } from "@/components/Heading";
import { tokens } from "@/styles/theme";
const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  const theme = useContext(ThemeContext);

  const headingToken =
    theme === "dark"
      ? tokens.Dark.Typography.Heading
      : tokens.Light.Typography.Heading;
  const subtextToken =
    theme === "dark"
      ? tokens.Dark.Typography.Subtext
      : tokens.Light.Typography.Subtext;

  const surfaceToken =
    theme === "dark"
      ? tokens.Dark.Surface.Primary
      : tokens.Light.Surface.Primary;
  const bgColor = resolveToken(surfaceToken);

  return (
    <section
      style={{ background: bgColor }}
      className="relative w-full py-12 md:py-20 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* Cosmic particle effect (background dots) */}
      <div className="absolute inset-0 cosmic-grid opacity-30"></div>

      {/* Gradient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full">
        <div className="w-full h-full opacity-10 bg-primary blur-[120px]"></div>
      </div>

      <div
        className={`relative z-10 max-w-4xl text-center space-y-6 transition-all duration-700 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-muted text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            New Yayy features
            <Loader className="h-3 w-3 animate-spin text-primary" />
          </span>
        </div>

        <h1
          style={{ color: resolveToken(headingToken) }}
          className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance font-brico"
        >
          Yayy — Discounts & rewards for{" "}
          <span style={{ color: resolveToken(headingToken) }}>students</span> &
          graduates
        </h1>

        <p
          style={{ color: resolveToken(subtextToken) }}
          className="text-lg md:text-xl max-w-2xl mx-auto text-balance"
        >
          Discover curated student discounts, manage your Yayy Card, earn
          points, and redeem rewards — all in one place for university students,
          WASSCE graduates, and National Service personnel.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 items-center">
          <Button
            onClick={() => {
              const el = document.getElementById("features");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-base h-12 px-8 transition-all duration-200 min-h-[48px]"
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Light.Surface.Primary
                  : tokens.Dark.Surface.Primary
              ),
              color: resolveToken(
                theme === "dark"
                  ? tokens.Light.Typography.Heading
                  : tokens.Dark.Typography.Heading
              ),
              borderColor: resolveToken(
                theme === "dark"
                  ? tokens.Light.Stroke["Stroke-02"]
                  : tokens.Dark.Stroke["Stroke-02"]
              ),
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}
          >
            Explore discounts
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // simple action to surface merchant information; replace with route when merchant page exists
              const el = document.getElementById("merchants");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px] rounded"
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Light.Surface.Primary
                  : tokens.Dark.Surface.Primary
              ),
              color: resolveToken(
                theme === "dark"
                  ? tokens.Light.Typography.Heading
                  : tokens.Dark.Typography.Heading
              ),
              borderColor: resolveToken(
                theme === "dark"
                  ? tokens.Light.Stroke["Stroke-02"]
                  : tokens.Dark.Stroke["Stroke-02"]
              ),
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}
          >
            For merchants
          </Button>
        </div>

        <div
          style={{
            color: resolveToken(
              theme === "dark"
                ? tokens.Dark.Typography.Subtext
                : tokens.Light.Typography.Subtext
            ),
          }}
          className="pt-6 text-sm text-muted-foreground"
        >
          For university students, WASSCE graduates, and National Service
          personnel
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
