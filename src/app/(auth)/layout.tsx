import { UiScale } from "@/components/ui/ui-scale";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UiScale />
      {children}
    </>
  );
}
