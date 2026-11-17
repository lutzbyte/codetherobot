import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/pages/HomePage";
import { WorldsPage } from "@/pages/WorldsPage";
import { LevelsPage } from "@/pages/LevelsPage";
import { CompletePage } from "@/pages/CompletePage";
import { AchievementsPage } from "@/pages/AchievementsPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { DailyPage } from "@/pages/DailyPage";
import { SettingsPage } from "@/pages/SettingsPage";
import {
  AboutPage,
  DisclaimerPage,
  HowToPlayPage,
  PrivacyPage,
  TermsPage,
} from "@/pages/ContentPages";
import { ContactPage } from "@/pages/ContactPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RouteError } from "@/pages/RouteError";

// Halaman yang memakai Phaser dimuat saat dibutuhkan, agar halaman lain tetap ringan.
const GameplayPage = lazy(() =>
  import("@/pages/GameplayPage").then((m) => ({ default: m.GameplayPage })),
);
const ChallengePage = lazy(() =>
  import("@/pages/ChallengePage").then((m) => ({ default: m.ChallengePage })),
);

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/worlds", element: <WorldsPage /> },
      { path: "/worlds/:worldId", element: <LevelsPage /> },
      { path: "/play/:levelId", element: <GameplayPage /> },
      { path: "/challenge/:kind", element: <ChallengePage /> },
      { path: "/complete", element: <CompletePage /> },
      { path: "/achievements", element: <AchievementsPage /> },
      { path: "/collection", element: <CollectionPage /> },
      { path: "/daily", element: <DailyPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/how-to-play", element: <HowToPlayPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
      { path: "/disclaimer", element: <DisclaimerPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);