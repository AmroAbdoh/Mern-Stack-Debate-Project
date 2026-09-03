import type { ReactNode } from "react";
import "../../styles/card.css";

interface PageCardProps {
  children: ReactNode;
  className?: string;
}

function PageCard({ children, className = "" }: PageCardProps) {
  return <main className={`page-card ${className}`.trim()}>{children}</main>;
}

export default PageCard;
