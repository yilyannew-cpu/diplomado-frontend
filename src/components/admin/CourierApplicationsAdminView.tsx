import { useCourierApplications } from "@/context/CourierApplicationsContext";
import { useOrders } from "@/context/OrderContext"; // to format date or similar?
import { usersMock } from "@/mocks/usersMock"; // since we need Courier info
import { Button } from "@/components/ui/button";

export function CourierApplicationsAdminView() {
  const { applications, reviewApplication } = useCourierApplications();

  // En el mock, solo traemos los domiciliarios para mostrar su nombre y vehículo
  const couriers = usersMock.filter(u => u.role === "domiciliario");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid md:grid-cols-12">
          <span className="col-span-3">Motorizado</span>
          <span className="col-span-3">Vehículo</span>
          <span className="col-span-3 text-center">Estado de Solicitud</span>
          <span className="col-span-3 text-right">Acciones</span>
        </div>
        
        {applications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applications.map(app => {
              const courier = couriers.find(c => c.id === app.courierId);
              if (!courier) return null;
              
              return (
                <div key={app.id} className="p-4 md:px-5 md:py-4 md:grid md:grid-cols-12 md:items-center flex flex-col gap-3">
                  <div className="col-span-3 flex items-center gap-3">
                    <img src={courier.avatar} className="size-10 rounded-full object-cover shrink-0" alt="" />
                    <div>
                      <p className="font-semibold text-sm">{courier.name}</p>
                      <p className="text-xs text-muted-foreground">{courier.document_id}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <p className="text-sm font-medium">{courier.vehicle_type}</p>
                    <p className="text-xs text-muted-foreground">{courier.vehicle_plate || "Sin placa"} • {courier.vehicle_description}</p>
                  </div>
                  
                  <div className="col-span-3 flex md:justify-center">
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
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => reviewApplication(app.id, "REJECTED")}>
                          Rechazar
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => reviewApplication(app.id, "ACCEPTED")}>
                          Contratar
                        </Button>
                      </>
                    ) : app.status === "ACCEPTED" ? (
                       <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => reviewApplication(app.id, "REJECTED")}>
                          Despedir
                        </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => reviewApplication(app.id, "ACCEPTED")}>
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
