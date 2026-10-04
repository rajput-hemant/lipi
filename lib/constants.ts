import { siteConfig } from "@/config/site";

export const CLIENTS = [
  { alt: "client1", logo: "/placeholders/client-1.png" },
  { alt: "client2", logo: "/placeholders/client-2.png" },
  { alt: "client3", logo: "/placeholders/client-3.png" },
  { alt: "client4", logo: "/placeholders/client-4.png" },
  { alt: "client5", logo: "/placeholders/client-5.png" },
];

export const LOBBY_CAPABILITIES = [
  {
    title: "Block editor",
    description:
      "Write with a Notion-style block editor, slash commands, and drag-and-drop blocks for headings, lists, and code.",
  },
  {
    title: "Nested documents",
    description:
      "Organize pages in a tree inside each workspace so specs, notes, and folders stay easy to browse.",
  },
  {
    title: "Workspace search",
    description:
      "Open Command+K from the dashboard to jump to documents across your workspace.",
  },
  {
    title: "Shared editing",
    description:
      "Edit documents together in the same workspace with live updates while you collaborate.",
  },
  {
    title: "Workspaces and invites",
    description:
      "Create workspaces, invite teammates, and keep project docs in one place with role-based access.",
  },
  {
    title: "Covers and layout",
    description:
      "Add cover banners and icons so documents are easy to spot in the sidebar and on the page.",
  },
  {
    title: "Autosave",
    description:
      "Changes save as you type so drafts and roadmaps stay up to date without a manual save step.",
  },
  {
    title: "Open source",
    description:
      "Self-host or inspect the codebase: Lipi is MIT-licensed and built with Next.js and Drizzle.",
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
        title: "Acceptable Use",
        description: `When using ${siteConfig.name}, you agree to use it lawfully and respectfully toward other users and collaborators, and not to interfere with the service or access content you are not authorized to see.`,
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
    lastUpdated: "October 4, 2026",
    sections: [
      {
        title: "Introduction",
        description: `${siteConfig.name} is an open-source web application developed under the MIT License. This Privacy Policy describes what information ${siteConfig.name} collects and how it is used. It is a general description for a showcase project, not legal advice.`,
      },
      {
        title: "Information We Collect",
        description: `Account data: your name, email address and a hashed password, or the profile details returned by Google or GitHub if you choose to sign in with them. Content: the workspaces, pages and files you create or upload, stored in our database and with our file upload provider. Billing: paid plans are processed by Stripe. We do not store card numbers; Stripe handles payment details. Usage: anonymous page-view analytics from Vercel Analytics.`,
      },
      {
        title: "How We Use Your Information",
        description: `We use your information to run ${siteConfig.name}: to sign you in, store and display your content, let collaborators edit pages together in real time, process subscriptions, and send transactional email such as password reset links through Resend. We do not sell your information.`,
      },
      {
        title: "Cookies and Tracking Technologies",
        description: `${siteConfig.name} sets cookies to keep you signed in and to remember interface preferences such as whether the sidebar is open. Vercel Analytics is used for page-view statistics.`,
      },
      {
        title: "Third-Party Services",
        description: `${siteConfig.name} relies on Stripe (billing), UploadThing (file uploads), Resend (email), Google and GitHub (optional sign-in) and Vercel (hosting and analytics). Each processes the data needed for its function under its own privacy policy. ${siteConfig.name} may also link to external websites, which this policy does not cover.`,
      },
      {
        title: "Data Retention and Deletion",
        description: `We keep your account and content while your account is active. To have your data deleted, contact us at the address below. Some records, such as billing history, may be retained where required by Stripe or by law.`,
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
