import { Clients } from "./components/clients";
import { Features } from "./components/features";
import { Hero } from "./components/hero";
import { OpenSource } from "./components/open-source";
import { TechStack } from "./components/tech-stack";
import { Testimonials } from "./components/testimonials";

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
