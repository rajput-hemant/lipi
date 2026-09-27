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
    "Open-source workspace for nested documents, block editing, Command+K search, shared editing, and team workspaces.",
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
