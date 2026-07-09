import { LayoutDashboard, Users, CheckSquare, Truck, Settings, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";

export type SuperadminModule = "dashboard" | "approvals" | "users" | "register" | "operations";

interface SuperadminSidebarProps {
  activeModule: SuperadminModule;
  setActiveModule: (module: SuperadminModule) => void;
  pendingCount?: number;
}

export function SuperadminSidebar({ activeModule, setActiveModule, pendingCount = 0 }: SuperadminSidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "approvals", label: "Aprobaciones", icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null },
    { id: "users", label: "Gestión Usuarios", icon: Users },
    { id: "register", label: "Registro Operativo", icon: UserPlus },
    { id: "operations", label: "Seguimiento", icon: Truck },
  ] as const;

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full sticky top-0">
      {/* Brand & Profile */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg shadow-sm">
            B
          </div>
          <div>
            <h1 className="font-display font-semibold text-sm tracking-tight leading-none">BurgerCore</h1>
            <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">Gobernanza</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Módulos</p>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id as SuperadminModule)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-primary-foreground" : "opacity-80"} />
                {item.label}
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name || 'Administrador'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@burgercore.co'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={16} />
          Volver al Inicio
        </button>
      </div>
    </aside>
  );
}
