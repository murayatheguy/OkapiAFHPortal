/**
 * PageLayout - Unified page wrapper with Header and Footer
 * Use this for all public-facing pages for consistent layout
 */

import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer, FooterCompact } from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  /** Use compact footer for internal/secondary pages */
  compactFooter?: boolean;
  /** Background color for main content area */
  bgColor?: "white" | "slate" | "gray";
  /** Hide footer completely */
  hideFooter?: boolean;
  /** Hide header completely */
  hideHeader?: boolean;
  /** Header variant */
  headerVariant?: "default" | "transparent";
  /** Additional class name for the container */
  className?: string;
}

export function PageLayout({
  children,
  compactFooter = false,
  bgColor = "white",
  hideFooter = false,
  hideHeader = false,
  headerVariant = "default",
  className = "",
}: PageLayoutProps) {
  const bgClasses = {
    white: "bg-white",
    slate: "bg-slate-50",
    gray: "bg-gray-50",
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgClasses[bgColor]} ${className}`}>
      {!hideHeader && <Header variant={headerVariant} />}
      <main className="flex-1">{children}</main>
      {!hideFooter && (compactFooter ? <FooterCompact /> : <Footer />)}
    </div>
  );
}
