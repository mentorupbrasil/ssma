import { TopbarBreadcrumb } from "@/components/dashboard/TopbarBreadcrumb";
import { TopbarSearch } from "@/components/dashboard/TopbarActions";
import { TopbarExpandableActions } from "@/components/dashboard/TopbarExpandableActions";

type TopbarProps = {
  userName: string;
};

export function Topbar({ userName }: TopbarProps) {
  return (
    <header className="app-shell-topbar">
      <div className="app-shell-topbar-inner">
        <div className="app-shell-topbar-leading">
          <TopbarBreadcrumb />
          <TopbarSearch />
        </div>

        <div className="app-shell-topbar-trailing">
          <TopbarExpandableActions userName={userName} />
        </div>
      </div>
    </header>
  );
}
