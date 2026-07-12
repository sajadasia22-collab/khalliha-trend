import { ServiceWorkerRegister } from "../../components/pwa/ServiceWorkerRegister";

// campaigns/ sits outside the (marketing) route group on purpose: this
// surface is dual-audience (anonymous visitors and logged-in dashboard
// users), and each page below picks its own header (public Navbar vs.
// DashboardHeader) — inheriting the marketing layout's unconditional
// Navbar+Footer would stack a second header on top of the dashboard chrome.
export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      {children}
    </>
  );
}
