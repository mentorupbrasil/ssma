import Link from "next/link";
import { Bell, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopbarProps = {
  userName: string;
};

export function Topbar({ userName }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar encaminhamentos, empresas, pacientes..."
            className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none focus:bg-white"
          />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="hidden rounded-xl text-slate-600 sm:flex">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver site
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Bell className="h-4 w-4 text-slate-600" />
          </Button>
          <div className="hidden rounded-xl bg-slate-50 px-3 py-2 sm:block">
            <p className="text-sm font-medium text-slate-700">{userName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
