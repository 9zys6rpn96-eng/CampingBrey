import { useEffect, useState } from "react";

function getViewportWidth() {
  if (typeof window === "undefined") {
    return 0;
  }

  return window.innerWidth;
}

export function useViewport() {
  const [width, setWidth] = useState(getViewportWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width > 0 && width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
  };
}

