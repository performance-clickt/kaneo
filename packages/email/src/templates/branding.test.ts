import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import enUS from "../../../../i18n/en-US.json";
import MagicLinkEmail from "./magic-link";
import NotificationEmail from "./notification";
import OtpEmail from "./otp";
import PasswordResetEmail from "./password-reset";
import TrialReminderEmail from "./trial-reminder";
import WorkspaceInvitationEmail from "./workspace-invitation";

const legacyProductName = /\bKaneo\b/;

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringValues);
  }
  return [];
}

describe("Clickt HiveMind email branding", () => {
  it.each(["en-US", "de-DE", "vi-VN"])(
    "uses the Clickt HiveMind name in %s template copy",
    async (locale) => {
      const templates = [
        createElement(MagicLinkEmail, {
          magicLink: "https://hivemind.example.com/sign-in",
          locale,
        }),
        createElement(OtpEmail, { otp: "123456", locale }),
        createElement(PasswordResetEmail, {
          resetLink: "https://hivemind.example.com/reset",
          locale,
        }),
        createElement(NotificationEmail, {
          title: "Task assigned",
          message: "A task was assigned to you.",
          actionUrl: "https://hivemind.example.com/tasks/1",
          locale,
        }),
      ];

      for (const template of templates) {
        const html = await render(template);
        expect(html).toContain("Clickt HiveMind");
        expect(html).not.toMatch(legacyProductName);
      }
    },
  );

  it("uses the Clickt HiveMind name in invitation emails", async () => {
    const html = await render(
      createElement(WorkspaceInvitationEmail, {
        workspaceName: "Acme",
        inviterName: "Alex",
        inviterEmail: "alex@example.com",
        invitationLink: "https://hivemind.example.com/invite/abc",
        to: "invitee@example.com",
        copy: enUS.invitations.email,
      }),
    );

    expect(html).toContain("Clickt HiveMind");
    expect(html).not.toMatch(legacyProductName);
  });

  it("distinguishes self-hosted Clickt HiveMind from Kaneo Cloud", async () => {
    const html = await render(
      createElement(TrialReminderEmail, {
        workspaceName: "Acme",
        daysLeft: 3,
        billingUrl: "https://hivemind.example.com/billing",
      }),
    );

    expect(html).toContain("Clickt HiveMind");
    expect(html).toContain("Kaneo Cloud");
    expect(html.replaceAll("Kaneo Cloud", "")).not.toMatch(legacyProductName);
  });

  it("allows legacy text in en-US only inside compatibility identifiers", () => {
    const remainingVisibleBranding = stringValues(enUS)
      .map((value) =>
        value
          .replaceAll("X-Kaneo-Signature", "")
          .replaceAll("https://example.com/webhooks/kaneo", ""),
      )
      .filter((value) => legacyProductName.test(value));

    expect(remainingVisibleBranding).toEqual([]);
  });
});
