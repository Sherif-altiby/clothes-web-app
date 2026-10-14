import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/home/Footer";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="ctm-container relative flex-1">{children}</div>
      <Footer />
    </>
  );
}
