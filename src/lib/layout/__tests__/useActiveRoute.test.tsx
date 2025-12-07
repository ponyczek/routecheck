import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useActiveRoute } from "../useActiveRoute";

describe("useActiveRoute", () => {
  beforeEach(() => {
    // Reset window.location before each test
    delete (window as any).location;
    window.location = {
      pathname: "/",
    } as Location;
  });

  it("should return route info for dashboard", () => {
    window.location.pathname = "/dashboard";
    const { result } = renderHook(() => useActiveRoute());

    expect(result.current.pathname).toBe("/dashboard");
    expect(result.current.pageTitle).toBe("Dashboard");
    expect(result.current.breadcrumbs).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        isCurrent: true,
      },
    ]);
  });

  it("should return route info for drivers", () => {
    window.location.pathname = "/drivers";
    const { result } = renderHook(() => useActiveRoute());

    expect(result.current.pathname).toBe("/drivers");
    expect(result.current.pageTitle).toBe("Kierowcy");
    expect(result.current.breadcrumbs).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        isCurrent: false,
      },
      {
        label: "Kierowcy",
        href: "/drivers",
        isCurrent: true,
      },
    ]);
  });

  it("should return route info for settings with parent", () => {
    window.location.pathname = "/settings/profile";
    const { result } = renderHook(() => useActiveRoute());

    expect(result.current.pathname).toBe("/settings/profile");
    expect(result.current.pageTitle).toBe("Profil firmy");
    expect(result.current.parentRoute).toBe("/settings");
    expect(result.current.breadcrumbs).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        isCurrent: false,
      },
      {
        label: "Ustawienia",
        href: "/settings",
        isCurrent: false,
      },
      {
        label: "Profil firmy",
        href: "/settings/profile",
        isCurrent: true,
      },
    ]);
  });

  it("should return default page title for unknown route", () => {
    window.location.pathname = "/unknown";
    const { result } = renderHook(() => useActiveRoute());

    expect(result.current.pathname).toBe("/unknown");
    expect(result.current.pageTitle).toBe("Strona");
    // Unknown routes still show Dashboard breadcrumb as starting point
    expect(result.current.breadcrumbs).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        isCurrent: false,
      },
    ]);
  });

  it("should handle home page route", () => {
    window.location.pathname = "/";
    const { result } = renderHook(() => useActiveRoute());

    expect(result.current.pathname).toBe("/");
    expect(result.current.pageTitle).toBe("Strona główna");
    expect(result.current.breadcrumbs).toEqual([
      {
        label: "Strona główna",
        href: "/",
        isCurrent: true,
      },
    ]);
  });
});
