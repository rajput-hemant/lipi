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
    name: "Alice",
    message:
      "Lipi has been a game-changer for our team. With its reliable end-to-end testing, we catch bugs early, leading to faster development cycles and improved collaboration.",
  },
  {
    name: "Bob",
    message:
      "I used to spend hours debugging frontend issues, but Lipi simplified everything. Now, I'm more productive, and my colleagues can trust our code thanks to Lipi.",
  },
  {
    name: "Charlie",
    message:
      "Lipi has transformed the way we work. Our QA and development teams are on the same page, and our productivity has skyrocketed. It's a must-have tool.",
  },
  {
    name: "David",
    message:
      "I was skeptical at first, but Lipi exceeded my expectations. Our project timelines have improved, and collaboration between teams is seamless.",
  },
  {
    name: "Ella",
    message:
      "Lipi made writing and running tests a breeze. Our team's productivity has never been higher, and we're delivering more reliable software.",
  },
  {
    name: "Frank",
    message:
      "Thanks to Lipi, we've eliminated testing bottlenecks. Our developers and testers collaborate effortlessly, resulting in quicker releases.",
  },
  {
    name: "Grace",
    message:
      "Lipi has improved our development process significantly. We now have more time for innovation, and our products are of higher quality.",
  },
  {
    name: "Hank",
    message:
      "Lipi's user-friendly interface made it easy for our non-technical team members to contribute to testing. Our workflow is much more efficient now.",
  },
  {
    name: "Ivy",
    message:
      "Our team's collaboration improved immensely with Lipi. We catch issues early, leading to less friction and quicker feature deployments.",
  },
  {
    name: "Jack",
    message:
      "Lipi's robust testing capabilities have elevated our development standards. We work more harmoniously, and our releases are more reliable.",
  },
  {
    name: "Katherine",
    message:
      "Lipi is a lifesaver for our cross-functional teams. We're more productive, and there's a shared sense of responsibility for product quality.",
  },
  {
    name: "Liam",
    message:
      "Lipi has helped us maintain high standards of quality. Our team's collaboration has improved, resulting in faster development cycles.",
  },
  {
    name: "Mia",
    message:
      "Lipi is a powerful tool that improved our productivity and collaboration. It's now an integral part of our development process.",
  },
  {
    name: "Nathan",
    message:
      "Lipi's user-friendly interface and detailed reporting have made testing a breeze. Our team's productivity is at an all-time high.",
  },
  {
    name: "Olivia",
    message:
      "We saw immediate benefits in terms of productivity and collaboration after adopting Lipi. It's an essential tool for our development workflow.",
  },
  {
    name: "Paul",
    message:
      "Lipi has streamlined our testing process and brought our teams closer. We're more efficient and deliver better results.",
  },
  {
    name: "Quinn",
    message:
      "Lipi has been a game-changer for us. Our productivity and collaboration have improved significantly, leading to better software.",
  },
  {
    name: "Rachel",
    message:
      "Thanks to Lipi, our testing process is now a seamless part of our development cycle. Our teams collaborate effortlessly.",
  },
  {
    name: "Sam",
    message:
      "Lipi is a fantastic tool that has revolutionized our workflow. Our productivity and collaboration have reached new heights.",
  },
];

export const PRICING_CARDS = [
  {
    planType: "Free Plan",
    price: "0",
    description: "Limited block trials for teams",
    highlightFeature: "",
    features: [
      "Unlimited blocks for teams",
      "Unlimited file uploads",
      "30 day page history",
      "Invite 2 guests",
    ],
  },
  {
    planType: "Pro Plan",
    price: "499",
    description: "Billed annually. ₹555 billed monthly",
    highlightFeature: "Everything in free +",
    features: [
      "Unlimited blocks for teams",
      "Unlimited file uploads",
      "1 year page history",
      "Invite 10 guests",
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
