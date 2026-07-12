"use client";

import { useState } from "react";
import { useToast } from "../ui/Toast";
import { LogOutIcon } from "../ui/icons";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/login";
      } else {
        showToast("فشل تسجيل الخروج، يرجى المحاولة مرة أخرى.", "error");
        setIsLoading(false);
      }
    } catch {
      showToast("حدث خطأ في الاتصال بالسيرفر.", "error");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="تسجيل الخروج"
      className="btn-icon"
      data-loading={isLoading ? "true" : undefined}
    >
      {isLoading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        <LogOutIcon size={18} strokeWidth={2} />
      )}
    </button>
  );
}
