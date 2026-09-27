import type { Metadata } from "next";

import { Clients } from "./components/clients";
import { Features } from "./components/features";
import { Hero } from "./components/hero";
import { OpenSource } from "./components/open-source";
import { TechStack } from "./components/tech-stack";
import { Testimonials } from "./components/testimonials";

export const metadata: Metadata = {
  title: "Lipi - All-In-One Collaborative Workspace",
  description:
    "An open-source Notion-style collaborative workspace featuring real-time multiplayer editing, block document tree, command search, and customizable workspaces.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TechStack />
      <Features />
      <Clients />
      <Testimonials />
      <OpenSource />
    </>
  );
}
