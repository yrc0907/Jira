import Link from "next/link";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
}

export function NavLink({
  href,
  icon,
  label,
  isCollapsed,
  isActive,
}: NavLinkProps) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isCollapsed ? "justify-center" : ""
          } ${isActive
            ? "bg-gray-100 text-gray-900"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
      >
        {icon}
        <span className={isCollapsed ? "hidden" : "inline-block"}>{label}</span>
      </div>
    </Link>
  );
} 