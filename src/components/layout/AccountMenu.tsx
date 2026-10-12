import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IconArrowDown } from "@stableflow/pay-ui/icons/outline/arrow-down";
import { IconLogout } from "@stableflow/pay-ui/icons/outline/logout";
import { IconResetPassword } from "@stableflow/pay-ui/icons/outline/reset-password";
import { EmailAvatar } from "@/components/recipient-avatar/EmailAvatar";
import { FLOATING_ALIGN, FLOATING_SIDE, useFloatingPosition } from "@stableflow/pay-ui/overlay";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { ResetPasswordDialog } from "@/views/auth/ResetPasswordDialog";
import { RESET_PASSWORD_VARIANT } from "@/views/auth/config";

export function AccountMenu({ className }: { className?: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.Start,
    offset: 8,
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const closeAndLogout = () => {
    setOpen(false);
    logout({ omitReturnTo: true });
    navigate("/login", { replace: true });
  };

  const openResetPassword = () => {
    setOpen(false);
    setResetOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn("inline-flex w-full min-w-0 items-center gap-2.5", className)}
      >
        <EmailAvatar
          email={user.email ?? ""}
          name={user.name ?? ""}
          className="size-5 shrink-0 rounded-[15px] text-[8px]"
        />
        <span className="min-w-0 flex-1 truncate text-left font-montserrat text-sm font-medium text-black">
          {user.name}
        </span>
        <IconArrowDown
          className={cn(
            "h-1 w-2.5 shrink-0 text-black translate-y-0.5 duration-150",
            open ? "rotate-180" : "",
          )}
        />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              style={panelStyle}
              className="z-1100 w-[249px] overflow-hidden rounded-[12px] border border-[#E0E0E0] bg-[#fdfdfd] shadow-[0_0_20px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-[70px] items-center gap-2 px-4">
                <EmailAvatar
                  email={user.email ?? ""}
                  name={user.name ?? ""}
                  className="size-10 text-sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-montserrat text-base font-medium text-black">
                    {user.name}
                  </p>
                  <p className="truncate font-montserrat text-sm font-normal text-black">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="h-px bg-[#E0E0E0]" />
              <div className="py-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={openResetPassword}
                  className="flex h-10 w-full items-center gap-2.5 px-[19px] font-montserrat text-sm font-medium text-[#606060] duration-150 hover:text-black"
                >
                  <IconResetPassword className="shrink-0" />
                  Change Password
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={closeAndLogout}
                  className="flex h-10 w-full items-center gap-2.5 px-[19px] font-montserrat text-sm font-medium text-[#606060] duration-150 hover:text-danger"
                >
                  <IconLogout className="shrink-0" />
                  Log out
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant={RESET_PASSWORD_VARIANT.Authed}
      />
    </>
  );
}
