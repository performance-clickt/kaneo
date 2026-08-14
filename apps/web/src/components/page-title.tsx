import { useEffect } from "react";
import { PRODUCT_NAME } from "@/constants/urls";

type PageTitleProps = {
  title: string;
  suffix?: string;
  hideAppName?: boolean;
};

export default function PageTitle({
  title,
  suffix = PRODUCT_NAME,
  hideAppName = false,
}: PageTitleProps) {
  useEffect(() => {
    const formattedTitle = hideAppName
      ? title
      : suffix
        ? `${title} · ${suffix}`
        : title;
    document.title = formattedTitle;
  }, [title, suffix, hideAppName]);

  return null;
}
