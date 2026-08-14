import { UPSTREAM_CHANGELOG_URL } from "@/constants/urls";

export function VersionDisplay() {
  const version = __APP_VERSION__;

  return (
    <div className="flex items-center justify-center px-2 py-1.5">
      <a
        href={UPSTREAM_CHANGELOG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        v{version}
      </a>
    </div>
  );
}
