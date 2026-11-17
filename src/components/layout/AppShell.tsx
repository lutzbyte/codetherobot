import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PageLoading } from "@/components/ui/PageLoading";
import { RouteSeo } from "@/seo/RouteSeo";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { SiteFooter } from "./SiteFooter";
import styles from "./AppShell.module.css";

/** Route layar penuh (tanpa navigasi) agar gameplay dan tantangan tidak terpotong. */
const FULLSCREEN_ROUTES = ["/play", "/complete", "/challenge"];

export function AppShell() {
  const { pathname } = useLocation();
  const fullscreen = FULLSCREEN_ROUTES.some((p) => pathname.startsWith(p));

  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        <RouteSeo />
        <RouteAnnouncer />
        <main id="main" tabIndex={-1} style={{ height: "100%" }}>
          <div key={pathname} className="page-enter" style={{ height: "100%" }}>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <RouteSeo />
      <RouteAnnouncer />
      <TopNav />
      <MobileHeader />
      <main id="main" tabIndex={-1} className={styles.main}>
        <div key={pathname} className="page-enter">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}