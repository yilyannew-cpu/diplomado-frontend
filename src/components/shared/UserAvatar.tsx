import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface UserAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function UserAvatar({ name, src, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolved = src?.trim() ? src : undefined;

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  return (
    <Avatar className={cn("shrink-0", className)}>
      {resolved && !failed ? (
        <AvatarImage
          key={resolved.slice(0, 48)}
          src={resolved}
          alt={name}
          className="object-cover"
          onLoadingStatusChange={(status) => {
            if (status === "error") setFailed(true);
          }}
        />
      ) : null}
      <AvatarFallback className="bg-ink text-xs font-semibold text-cream">
        {getUserInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
