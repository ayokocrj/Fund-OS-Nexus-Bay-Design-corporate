import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/core/providers";
import { Shell } from "@/components/core/shell";

export const metadata = { title: "Fund OS · Agent Core (Phase 0)", description: "Nexus Bay Fund OS — bounded research agent core. Synthetic data only." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
