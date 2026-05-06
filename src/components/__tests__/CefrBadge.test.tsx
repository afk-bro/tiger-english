import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CefrBadge, getCefrColorClasses } from "../CefrBadge";

describe("CefrBadge", () => {
  it("renders the CEFR level text", () => {
    render(<CefrBadge level="A1" />);
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  it("renders B1+ level correctly", () => {
    render(<CefrBadge level="B1+" />);
    expect(screen.getByText("B1+")).toBeInTheDocument();
  });

  it("has aria-label for accessibility", () => {
    render(<CefrBadge level="A2" />);
    expect(screen.getByLabelText("CEFR level A2")).toBeInTheDocument();
  });

  it("applies sm size classes", () => {
    render(<CefrBadge level="A1" size="sm" />);
    const badge = screen.getByText("A1");
    expect(badge).toHaveClass("h-5", "px-2", "text-xs");
  });

  it("applies md size classes by default", () => {
    render(<CefrBadge level="A1" />);
    const badge = screen.getByText("A1");
    expect(badge).toHaveClass("h-6", "px-3", "text-sm");
  });

  it("applies lg size classes", () => {
    render(<CefrBadge level="A1" size="lg" />);
    const badge = screen.getByText("A1");
    expect(badge).toHaveClass("h-8", "px-4", "text-base");
  });

  it("passes additional className", () => {
    render(<CefrBadge level="A1" className="my-custom-class" />);
    expect(screen.getByText("A1")).toHaveClass("my-custom-class");
  });
});

describe("getCefrColorClasses", () => {
  it("returns stone classes for A0", () => {
    const classes = getCefrColorClasses("A0");
    expect(classes).toContain("stone");
  });

  it("returns stone classes for A1", () => {
    const classes = getCefrColorClasses("A1");
    expect(classes).toContain("stone");
  });

  it("returns sky classes for A2", () => {
    const classes = getCefrColorClasses("A2");
    expect(classes).toContain("sky");
  });

  it("returns sky classes for B1", () => {
    const classes = getCefrColorClasses("B1");
    expect(classes).toContain("sky");
  });

  it("returns indigo classes for B1+", () => {
    const classes = getCefrColorClasses("B1+");
    expect(classes).toContain("indigo");
  });

  it("returns indigo classes for B2", () => {
    const classes = getCefrColorClasses("B2");
    expect(classes).toContain("indigo");
  });

  it("returns violet classes for C1", () => {
    const classes = getCefrColorClasses("C1");
    expect(classes).toContain("violet");
  });

  it("returns gray classes for unknown level", () => {
    const classes = getCefrColorClasses("X9");
    expect(classes).toContain("gray");
  });
});
