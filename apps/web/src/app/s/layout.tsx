import { DashboardLocaleProvider } from "@/components/dashboard/dashboard-locale-provider";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { playfair } from "@/lib/fonts";

export const dynamic = "force-dynamic";

export default function StaffWaiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLocaleProvider initialLang="GR" fixedLang="GR">
      <div className={playfair.variable}>
        <ConfirmDialogHost />
        {children}
      </div>
    </DashboardLocaleProvider>
  );
}
