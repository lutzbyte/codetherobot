import { Article } from "@/components/ui/Article";
import {
  ABOUT,
  DISCLAIMER,
  HOW_TO_PLAY,
  PRIVACY,
  TERMS,
} from "@/content/pages";
import { LAST_UPDATED } from "@/site/siteInfo";

export function HowToPlayPage() {
  return (
    <Article
      title="How to Play"
      subtitle="Everything you need to guide the robot"
      sections={HOW_TO_PLAY}
    />
  );
}

export function AboutPage() {
  return <Article title="About" subtitle="Think. Code. Execute." sections={ABOUT} />;
}

export function PrivacyPage() {
  return (
    <Article
      title="Privacy Policy"
      subtitle="What is stored, and what advertising may collect"
      updated={LAST_UPDATED}
      sections={PRIVACY}
    />
  );
}

export function TermsPage() {
  return (
    <Article
      title="Terms of Service"
      subtitle="The rules for playing"
      updated={LAST_UPDATED}
      sections={TERMS}
    />
  );
}

export function DisclaimerPage() {
  return (
    <Article
      title="Disclaimer"
      subtitle="What the game does and does not promise"
      sections={DISCLAIMER}
    />
  );
}