import { useTranslation } from "react-i18next";
import { SOURCE_REPOSITORY_URL } from "@/constants/urls";

export function KaneoBranding() {
  const { t } = useTranslation();

  return (
    <a
      href={SOURCE_REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground transition-colors"
    >
      {t("publicProject:branding.poweredBy")}{" "}
      <span className="font-medium">{t("common:appName")}</span>
    </a>
  );
}
