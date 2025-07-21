import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 bg-gray-50 p-8">{children}</main>
    </div>
  );
} 