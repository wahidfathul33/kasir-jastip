import { STATUS_COLOR, STATUS_LABEL, type Status } from "@/lib/types";

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
