import { createServerSupabaseClient } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";

// Prevent static prerendering — this layout reads cookies at runtime
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar user={user} />
      <main
        style={{
          marginLeft: "220px",
          flex: 1,
          background: "#0A0A0A",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
