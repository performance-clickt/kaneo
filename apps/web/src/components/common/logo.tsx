import { Link } from "@tanstack/react-router";
import { PRODUCT_NAME } from "@/constants/urls";
import useProjectStore from "@/store/project";

type LogoProps = {
  className?: string;
  compactOnCollapsed?: boolean;
  imageClassName?: string;
};

export function Logo({
  className = "",
  compactOnCollapsed = false,
  imageClassName = "h-6",
}: LogoProps) {
  const { setProject } = useProjectStore();
  const collapsedLockupClass = compactOnCollapsed
    ? "group-data-[collapsible=icon]:hidden"
    : "";

  return (
    <Link
      onClick={() => {
        setProject(undefined);
      }}
      to="/dashboard"
      className={`w-auto max-w-full overflow-hidden ${className}`}
      aria-label={PRODUCT_NAME}
    >
      <img
        src="/logo-dark.svg"
        alt=""
        aria-hidden="true"
        className={`${imageClassName} w-auto max-w-full dark:hidden ${collapsedLockupClass}`}
      />
      <img
        src="/logo-light.svg"
        alt=""
        aria-hidden="true"
        className={`hidden ${imageClassName} w-auto max-w-full dark:block ${collapsedLockupClass}`}
      />
      {compactOnCollapsed ? (
        <img
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
          className={`hidden ${imageClassName} w-auto shrink-0 group-data-[collapsible=icon]:block`}
        />
      ) : null}
    </Link>
  );
}
