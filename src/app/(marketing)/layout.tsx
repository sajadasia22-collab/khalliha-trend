import { Navbar } from "../../components/layout/Navbar";
import { Footer } from "../../components/layout/Footer";
import { ServiceWorkerRegister } from "../../components/pwa/ServiceWorkerRegister";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <ServiceWorkerRegister />
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
