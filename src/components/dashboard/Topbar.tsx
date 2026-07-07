import Link from "next/link";
import { Bell, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopbarProps = {
  userName: string;
};

export function Topbar({ userName }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar encaminhamentos, empresas, pacientes..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <Link href="/" target="_blank">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver site
          </Button>
        </Link>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden text-sm sm:block">
          <p className="font-medium text-slate-700">{userName}</p>
        </div>
      </div>
    </header>
  );
}
