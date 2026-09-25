import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const token = localStorage.getItem("@SmartTennis:token");
    
    if (!token) {
      throw redirect({ to: "/auth" });
    }

    return { token };
  },
  component: () => <Outlet />,
});