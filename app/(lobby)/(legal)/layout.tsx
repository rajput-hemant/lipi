import React from "react";

export default function LegalLayout({ children }: React.PropsWithChildren) {
  return (
    <main className="py-4">
      {children}

      <p className="text-center text-sm text-muted-foreground">
        This is a mock page and does not reflect the{" "}
        <span className="font-medium text-foreground">
          Terms and Conditions
        </span>{" "}
        and <span className="font-medium text-foreground">Privacy Policy</span>{" "}
        of our website.
      </p>
    </main>
  );
}
