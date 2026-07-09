import { useState } from "react";
import { type PendingUser } from "@/lib/api/types";
import { ChevronDown, ChevronUp, Store, Bike, FileText, MapPin, Mail, Phone, Clock, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalQueueProps {
  pendingUsers: PendingUser[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
}

export function ApprovalQueue({ pendingUsers, approveUser, rejectUser }: ApprovalQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (pendingUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border">
        <CheckSquare className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No hay solicitudes pendientes</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Desconocido";
    return new Date(dateStr).toLocaleString("es-CO", { 
      day: "2-digit", month: "short", year: "numeric", 
      hour: "2-digit", minute: "2-digit" 
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-brand/30 bg-card">
      <div className="border-b border-amber-brand/20 bg-amber-brand/5 px-4 py-3 sm:px-5">
        <h2 className="font-display text-sm font-semibold text-amber-brand sm:text-base flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-brand"></span>
          </span>
          Cola de Aprobación ({pendingUsers.length})
        </h2>
      </div>

      <div className="divide-y divide-amber-brand/10">
        {pendingUsers.map((u) => {
          const isExpanded = expandedId === u.id;
          const isRestaurante = u.role === "admin";
          const RoleIcon = isRestaurante ? Store : Bike;

          return (
            <div key={u.id} className="flex flex-col transition-colors hover:bg-muted/30">
              
              {/* Header (Siempre visible) */}
              <div 
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 cursor-pointer",
                  isExpanded && "bg-muted/50"
                )}
                onClick={() => toggleExpand(u.id)}
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    isRestaurante ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"
                  )}>
                    <RoleIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        isRestaurante ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {isRestaurante ? 'Restaurante' : 'Domiciliario'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block">
                    {formatDate(u.created_at)}
                  </span>
                  <button
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary transition-colors"
                  >
                    Ver detalles
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Contenido Expandido */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="bg-background rounded-xl p-4 border border-border/50 shadow-sm mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Información de registro
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="flex items-start gap-2.5">
                        <Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Correo Electrónico</p>
                          <p className="text-sm font-medium">{u.email}</p>
                        </div>
                      </div>

                      {u.phone && (
                        <div className="flex items-start gap-2.5">
                          <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Teléfono</p>
                            <p className="text-sm font-medium">{u.phone}</p>
                          </div>
                        </div>
                      )}

                      {isRestaurante && u.restaurant && (
                        <>
                          <div className="flex items-start gap-2.5">
                            <Store className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Nombre del Local</p>
                              <p className="text-sm font-medium">{u.restaurant.name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Ubicación</p>
                              <p className="text-sm font-medium">{u.restaurant.address}, {u.restaurant.city}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {!isRestaurante && (
                        <>
                          {u.document_id && (
                            <div className="flex items-start gap-2.5">
                              <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Documento de Identidad</p>
                                <p className="text-sm font-medium">{u.document_id}</p>
                              </div>
                            </div>
                          )}
                          {u.vehicle && (
                            <div className="flex items-start gap-2.5">
                              <Bike className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Vehículo Registrado</p>
                                <p className="text-sm font-medium">{u.vehicle}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                    <button
                      onClick={(e) => { e.stopPropagation(); rejectUser(u.id); }}
                      className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                    >
                      Rechazar Solicitud
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); approveUser(u.id); }}
                      className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-all"
                    >
                      Aprobar e Ingresar al Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
