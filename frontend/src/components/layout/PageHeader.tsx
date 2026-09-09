import { useOutletContext } from "react-router-dom";
import { TopBar } from "./TopBar";
import type { ShellOutletContext } from "./AppShell";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const { openSidebar } = useOutletContext<ShellOutletContext>();
  return <TopBar title={title} subtitle={subtitle} onMenu={openSidebar} actions={actions} />;
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 p-4 md:p-6">{children}</div>;
}
