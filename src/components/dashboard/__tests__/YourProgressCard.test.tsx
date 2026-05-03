import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import YourProgressCard from "../YourProgressCard";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts) {
        const flat = Object.entries(opts)
          .map(([k, v]) => `${k}=${v}`)
          .join(",");
        return `${key}::${flat}`;
      }
      return key;
    },
    i18n: mockI18n,
  }),
}));

beforeEach(() => {
  mockI18n.language = "en";
});

const baseActivity = {
  lessons_completed: 3,
  exercises_attempted: 50,
  exercises_correct: 40,
  flashcards_reviewed: 100,
  flashcards_mastered: 25,
};

describe("YourProgressCard", () => {
  it("renders the heading", () => {
    render(<YourProgressCard activity={baseActivity} lastActiveAt={null} timezone="UTC" />);
    expect(screen.getByText("dashboard.yourProgress.heading")).toBeInTheDocument();
  });

  it("renders all four metric lines", () => {
    render(<YourProgressCard activity={baseActivity} lastActiveAt={null} timezone="UTC" />);
    // Lessons: count=3
    expect(screen.getByText(/lessonsCompleted::count=3/)).toBeInTheDocument();
    // Exercises: attempts=50, accuracy=80
    expect(screen.getByText(/exercises::attempts=50,accuracy=80/)).toBeInTheDocument();
    // Flashcards: reviewed=100, mastered=25
    expect(screen.getByText(/flashcards::reviewed=100,mastered=25/)).toBeInTheDocument();
    // Last studied: never (because lastActiveAt is null)
    expect(screen.getByText(/lastStudied\.label::relative=.*never/)).toBeInTheDocument();
  });

  it("computes accuracy as 0 when no attempts (no NaN)", () => {
    const zeroActivity = { ...baseActivity, exercises_attempted: 0, exercises_correct: 0 };
    render(<YourProgressCard activity={zeroActivity} lastActiveAt={null} timezone="UTC" />);
    expect(screen.getByText(/accuracy=0/)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("renders 'today' when last activity is today (UTC)", () => {
    const now = new Date().toISOString();
    render(<YourProgressCard activity={baseActivity} lastActiveAt={now} timezone="UTC" />);
    expect(screen.getByText(/lastStudied\.label.*today/)).toBeInTheDocument();
  });

  it("renders 'yesterday' when last activity is yesterday (UTC)", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    render(<YourProgressCard activity={baseActivity} lastActiveAt={yesterday} timezone="UTC" />);
    expect(screen.getByText(/lastStudied\.label.*yesterday/)).toBeInTheDocument();
  });

  it("renders '{{count}} days ago' when last activity is 5 days ago (UTC)", () => {
    const fiveDays = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    render(<YourProgressCard activity={baseActivity} lastActiveAt={fiveDays} timezone="UTC" />);
    expect(screen.getByText(/daysAgo::count=5/)).toBeInTheDocument();
  });

  it("renders 'never' when lastActiveAt is null", () => {
    render(<YourProgressCard activity={baseActivity} lastActiveAt={null} timezone="UTC" />);
    expect(screen.getByText(/lastStudied\.label.*never/)).toBeInTheDocument();
  });

  it("renders zero state cleanly (no NaN, no undefined)", () => {
    const zero = {
      lessons_completed: 0, exercises_attempted: 0, exercises_correct: 0,
      flashcards_reviewed: 0, flashcards_mastered: 0,
    };
    const { container } = render(<YourProgressCard activity={zero} lastActiveAt={null} timezone="UTC" />);
    const html = container.innerHTML;
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
    expect(screen.getByText(/count=0/)).toBeInTheDocument();
  });
});
