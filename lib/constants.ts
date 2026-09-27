import { siteConfig } from "@/config/site";

export const CLIENTS = [
  { alt: "client1", logo: "/placeholders/client-1.png" },
  { alt: "client2", logo: "/placeholders/client-2.png" },
  { alt: "client3", logo: "/placeholders/client-3.png" },
  { alt: "client4", logo: "/placeholders/client-4.png" },
  { alt: "client5", logo: "/placeholders/client-5.png" },
];

export const USERS = [
  {
    name: "Alex",
    message:
      "Lipi strikes the right balance between markdown simplicity and a modern block editor. Slash commands make drafting specs effortless.",
  },
  {
    name: "Sarah",
    message:
      "The real-time multiplayer editing is super responsive. Having live cursor presence and instant sync makes team planning frictionless.",
  },
  {
    name: "Devon",
    message:
      "Nested document trees make organizing extensive technical documentation and meeting notes clear and structured.",
  },
  {
    name: "Elena",
    message:
      "Command+K search is blazing fast. Finding any note, spec, or snippet across workspaces happens in milliseconds.",
  },
  {
    name: "Marcus",
    message:
      "I love having an open-source workspace that feels as polished as commercial tools without sacrificing privacy or speed.",
  },
  {
    name: "Priya",
    message:
      "The distraction-free UI and keyboard-first navigation let me stay completely in flow when writing and planning projects.",
  },
  {
    name: "Jordan",
    message:
      "Inviting teammates to workspaces and managing permissions is straightforward. Everyone knows where to find our project docs.",
  },
  {
    name: "Maya",
    message:
      "Drag-and-drop block reorganization and cover banners make every document look clean and presentation-ready.",
  },
  {
    name: "Liam",
    message:
      "The typography, dark mode contrast, and responsive layout make Lipi a pleasure to use whether on desktop or mobile.",
  },
  {
    name: "Chloe",
    message:
      "Instant autosave gives me total confidence that my notes and architecture roadmaps are safe and up to date.",
  },
  {
    name: "Kai",
    message:
      "From daily standup notes to engineering RFCs, having everything organized in one clean workspace keeps our team aligned.",
  },
  {
    name: "Taylor",
    message:
      "The open-source stack is rock solid. Next.js and Drizzle give it incredible speed and zero perceptible latency.",
  },
];

export const PRICING_CARDS = [
  {
    planType: "Free Plan",
    price: "0",
    description: "Essential workspace for personal notes and small teams",
    highlightFeature: "",
    features: [
      "1 workspace",
      "Up to 500 blocks",
      "2 collaborators",
      "Core editing features",
    ],
  },
  {
    planType: "Pro Plan",
    price: "499",
    description: "Billed monthly. Complete power for teams and professionals",
    highlightFeature: "Everything in free +",
    features: [
      "Unlimited workspaces",
      "Unlimited blocks",
      "Unlimited collaborators",
      "Priority support",
    ],
  },
];

export const PRICING_PLANS = { proplan: "Pro Plan", freeplan: "Free Plan" };

export const MAX_FOLDERS_FREE_PLAN = 3;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const LEGAL = {
  termsOfService: {
    lastUpdated: "December 15, 2023",
    sections: [
      {
        title: "Acceptance of Terms",
        description: `By using ${siteConfig.name}, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you are using ${siteConfig.name} on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these terms.`,
      },
      {
        title: "License",
        description: `${siteConfig.name} is an open-source project distributed under the MIT License. You are free to use, modify, and distribute ${siteConfig.name}'s source code in accordance with the terms specified in the MIT License. A copy of the MIT License is included in the ${siteConfig.name} repository.`,
      },
      {
        title: "Code of Conduct",
        description: `When using ${siteConfig.name}, you agree to abide by our Code of Conduct, available in the project repository. The Code of Conduct outlines the expected behavior within the ${siteConfig.name} community and helps create a positive and inclusive environment for all contributors.`,
      },
      {
        title: "No Warranty",
        description: `${siteConfig.name} is provided "as is" without warranty of any kind, express or implied. The developers of ${siteConfig.name} make no guarantees regarding its functionality, security, or fitness for a particular purpose. You use ${siteConfig.name} at your own risk.`,
      },
      {
        title: "Limitation of Liability",
        description: `In no event shall the developers of ${siteConfig.name} be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use of ${siteConfig.name}.`,
      },
      {
        title: "Contributions",
        description: `Contributions to ${siteConfig.name} are welcome, and by submitting a pull request or contributing in any other way, you agree to license your contribution under the terms of the MIT License.`,
      },
      {
        title: "Termination",
        description: `The developers of ${siteConfig.name} reserve the right to terminate or suspend access to ${siteConfig.name} at any time, with or without cause and with or without notice.`,
      },
      {
        title: "Changes to Terms",
        description: `These Terms of Service may be updated from time to time. It is your responsibility to review these terms periodically. Your continued use of ${siteConfig.name} after changes to these terms signifies your acceptance of the updated terms.`,
      },
      {
        title: "Contact Information",
        description: `If you have any questions or concerns about these Terms of Service, please contact us at ${siteConfig.author.email}.`,
      },
    ],
  },

  privacyPolicy: {
    lastUpdated: "December 15, 2023",
    sections: [
      {
        title: "Introduction",
        description: `Thank you for choosing ${siteConfig.name}, an open-source web application developed under the MIT License. This Privacy Policy outlines how we collect, use, disclose, and protect your information when you use ${siteConfig.name}. By using ${siteConfig.name}, you consent to the practices described in this Privacy Policy.`,
      },
      {
        title: "Information We Collect",
        description: `- **Personal Information:** We do not collect any personal information from ${siteConfig.name} users. ${siteConfig.name} is designed to respect your privacy, and any data you enter or generate while using the application remains on your local device.`,
      },
      {
        title: "How We Use Your Information",
        description: `- **Usage Data:** ${siteConfig.name} does not collect any usage data. All data generated or processed within the application stays locally on your device.`,
      },
      {
        title: "Cookies and Tracking Technologies",
        description: `- **Cookies:** ${siteConfig.name} does not use cookies or any tracking technologies.`,
      },
      {
        title: "Data Security",
        description: `- **Data Storage:** As an open-source project, ${siteConfig.name} does not store any user data on external servers. All data remains on the user's local device.`,
      },
      {
        title: "Third-Party Links",
        description: `- **External Links:** ${siteConfig.name} may contain links to external websites or resources. This Privacy Policy applies only to ${siteConfig.name} and does not cover the privacy practices of third-party websites.`,
      },
      {
        title: "Changes to Privacy Policy",
        description: `- **Updates:** This Privacy Policy may be updated from time to time. It is your responsibility to review this policy periodically. Your continued use of ${siteConfig.name} after changes to this policy signifies your acceptance of the updated terms.`,
      },
      {
        title: "Contact Information",
        description: `If you have any questions or concerns about this Privacy Policy, please contact us at ${siteConfig.author.email}.`,
      },
    ],
  },
};
