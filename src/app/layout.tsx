import { EnergyWorkspaceProvider } from "@/components/energy-workspace";
import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "GRID / ALIVE — Britain, electrified",
  description:
    "Explore Britain’s regional electricity mix, understand national demand and plan household energy use from one map.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EnergyWorkspaceProvider>{children}</EnergyWorkspaceProvider>
      </body>
    </html>
  );
}
