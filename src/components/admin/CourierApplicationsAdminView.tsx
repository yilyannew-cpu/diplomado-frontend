import { useCourierApplications } from "@/context/CourierApplicationsContext";
import { Button } from "@/components/ui/button";

export function CourierApplicationsAdminView() {
  const { applications, reviewApplication, isLoading } = useCourierApplications();

  if (isLoading) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando solicitudes…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid md:grid-cols-12">
          <span className="col-span-4">Motorizado</span>
          <span className="col-span-3">Restaurante</span>
          <span className="col-span-2 text-center">Estado de Solicitud</span>
          <span className="col-span-3 text-right">Acciones</span>
        </div>
        
        {applications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applications.map(app => {
              return (
                <div key={app.id} className="p-4 md:px-5 md:py-4 md:grid md:grid-cols-12 md:items-center flex flex-col gap-3">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {(app.courierName ?? "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{app.courierName ?? "Domiciliario"}</p>
                      <p className="text-xs text-muted-foreground">ID: {app.courierId.substring(0, 8)}…</p>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <p className="text-sm font-medium">{app.restaurantName ?? "Restaurante"}</p>
                  </div>
                  
                  <div className="col-span-2 flex md:justify-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      app.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      app.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="col-span-3 flex gap-2 justify-end">
                    {app.status === "PENDING" ? (
                      <>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => void reviewApplication(app.id, "REJECTED")}>
                          Rechazar
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => void reviewApplication(app.id, "ACCEPTED")}>
                          Contratar
                        </Button>
                      </>
                    ) : app.status === "ACCEPTED" ? (
                       <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => void reviewApplication(app.id, "REJECTED")}>
                          Despedir
                        </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => void reviewApplication(app.id, "ACCEPTED")}>
                        Re-contratar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
