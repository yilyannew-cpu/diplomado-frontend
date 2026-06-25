import {
  BellRing,
  ChefHat,
  PackageCheck,
  ThumbsUp,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { OrderStatus } from "@/mocks/ordersMock";
import { cn } from "@/lib/utils";

const STATUS_ICON_CONFIG: Record<
  string,
  { Icon: LucideIcon; activeAnimation: string }
> = {
  Recibido: { Icon: ThumbsUp, activeAnimation: "animate-order-icon-thumbs" },
  "En Cocina": { Icon: ChefHat, activeAnimation: "animate-order-icon-cook" },
  Listo: { Icon: BellRing, activeAnimation: "animate-order-icon-bell" },
  "En Camino": { Icon: Truck, activeAnimation: "animate-order-icon-delivery" },
  Entregado: { Icon: PackageCheck, activeAnimation: "animate-order-icon-delivered" },
};

interface StatusStepIconProps {
  status: OrderStatus;
  active: boolean;
  completed: boolean;
  className?: string;
}

export function StatusStepIcon({ status, active, completed, className }: StatusStepIconProps) {
  const config = STATUS_ICON_CONFIG[status] ?? STATUS_ICON_CONFIG.Recibido;
  const { Icon, activeAnimation } = config;

  return (
    <Icon
      className={cn(
        "size-5 transition-all duration-500",
        active && activeAnimation,
        completed && !active && "opacity-90",
        !active && !completed && "opacity-40",
        className,
      )}
      strokeWidth={active ? 2.25 : 2}
      aria-hidden
    />
  );
}
