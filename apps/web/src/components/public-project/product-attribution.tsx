import { useTranslation } from "react-i18next";
import { PRODUCT_NAME, SOURCE_REPOSITORY_URL } from "@/constants/urls";

export function ProductAttribution() {
  const { t } = useTranslation();

  return (
    <a
      href={SOURCE_REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground transition-colors"
      aria-label={`View ${PRODUCT_NAME} source code`}
    >
      {t("publicProject:branding.poweredBy")}{" "}
      <span className="font-medium">{PRODUCT_NAME}</span>
    </a>
  );
}
