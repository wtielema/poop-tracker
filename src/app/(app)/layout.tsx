import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </AuthGuard>
  );
}
