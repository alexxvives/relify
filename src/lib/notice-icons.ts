import {
  Ban,
  Bell,
  Briefcase,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  FileCheck,
  FolderOpen,
  HandCoins,
  MessageCircle,
  MessagesSquare,
  Receipt,
  Reply,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type NoticeIconStyle = {
  Icon: LucideIcon;
  chip: string;
};

export function noticeIconFor(title: string): NoticeIconStyle {
  if (title.includes("Proceso cancelado")) {
    return { Icon: Ban, chip: "bg-[#fdeceb] text-[#c0362c]" };
  }

  if (title.includes("NDA")) {
    return { Icon: ShieldCheck, chip: "bg-[#e8f6ee] text-[#17663a]" };
  }

  if (title.includes("Carta aceptada")) {
    return { Icon: FileCheck, chip: "bg-[#e7f7f2] text-[#0f766e]" };
  }

  if (title.includes("Pregunta") || title.includes("pregunta")) {
    return { Icon: MessageCircle, chip: "bg-[#eef2ff] text-[#465ab4]" };
  }

  if (title.includes("Mensaje")) {
    return { Icon: MessagesSquare, chip: "bg-[#e8f4fb] text-[#1b6f9a]" };
  }

  if (title.includes("Reunión") || title.includes("reunión")) {
    return { Icon: CalendarClock, chip: "bg-[#fff4e8] text-[#b05a12]" };
  }

  if (title.includes("Oferta")) {
    return { Icon: Sparkles, chip: "bg-[#f3e8ff] text-[#7a3db8]" };
  }

  if (title.includes("Respuesta")) {
    return { Icon: Reply, chip: "bg-[#e8fbf6] text-[#0f766e]" };
  }

  if (title.includes("Dataroom") || title.includes("document")) {
    return { Icon: FolderOpen, chip: "bg-[#eef0f3] text-[#3d4a63]" };
  }

  if (title.includes("depósito") || title.includes("Depósito") || title.includes("Pago")) {
    return { Icon: HandCoins, chip: "bg-[#ecfdf3] text-[#17663a]" };
  }

  if (title.includes("Presupuesto")) {
    return { Icon: Receipt, chip: "bg-[#fff6e8] text-[#b05a12]" };
  }

  if (title.includes("asesoramiento")) {
    return { Icon: ClipboardList, chip: "bg-[#f3e8ff] text-[#7a3db8]" };
  }

  if (title.includes("Encargo") || title.includes("encargo")) {
    return { Icon: Briefcase, chip: "bg-[#eef2ff] text-[#3d34b8]" };
  }

  if (title.includes("interés")) {
    return { Icon: UserPlus, chip: "bg-[#e8f4fb] text-[#1b6f9a]" };
  }

  if (title.includes("Solicitud rechazada") || title.includes("rechaz")) {
    return { Icon: XCircle, chip: "bg-[#fdeceb] text-[#c0362c]" };
  }

  if (title.includes("Solicitud aceptada") || title.includes("aceptad")) {
    return { Icon: CircleCheck, chip: "bg-[#e8f6ee] text-[#17663a]" };
  }

  if (title.includes("Solicitud enviada")) {
    return { Icon: Send, chip: "bg-[#eef2ff] text-[#465ab4]" };
  }

  return { Icon: Bell, chip: "bg-[#f4f6f8] text-[#5c6b78]" };
}
