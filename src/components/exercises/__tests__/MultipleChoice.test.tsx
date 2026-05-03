// src/components/exercises/__tests__/MultipleChoice.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultipleChoice from "../MultipleChoice";
import type { McqExercise } from "../exercises.types";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

const exercise: McqExercise = {
  id: "mcq-1",
  question: "What does 'hello' mean?",
  options: [
    { id: "a", text: "Goodbye" },
    { id: "b", text: "A greeting" },
    { id: "c", text: "Thank you" },
  ],
  correctOptionId: "b",
};

describe("MultipleChoice", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the question and all options", () => {
    render(<MultipleChoice exercise={exercise} />);
    expect(screen.getByText("What does 'hello' mean?")).toBeInTheDocument();
    expect(screen.getByText("Goodbye")).toBeInTheDocument();
    expect(screen.getByText("A greeting")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });

  it("shows correct feedback when correct option is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("A greeting"));
    expect(screen.getByText("lessons.exercises.correct")).toBeInTheDocument();
  });

  it("shows incorrect feedback when wrong option is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    expect(screen.getByText("lessons.exercises.incorrect")).toBeInTheDocument();
  });

  it("disables option buttons after an answer is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    // Option buttons are disabled
    expect(screen.getByText("Goodbye").closest("button")).toBeDisabled();
    expect(screen.getByText("A greeting").closest("button")).toBeDisabled();
    expect(screen.getByText("Thank you").closest("button")).toBeDisabled();
  });

  it("shows Try again button on incorrect answer and resets on click", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    expect(screen.getByText("lessons.exercises.tryAgain")).toBeInTheDocument();
    await user.click(screen.getByText("lessons.exercises.tryAgain"));
    // Options are re-enabled after reset
    expect(screen.getByText("Goodbye").closest("button")).not.toBeDisabled();
    expect(screen.queryByText("lessons.exercises.incorrect")).not.toBeInTheDocument();
  });

  it("does not show Try again on correct answer", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("A greeting"));
    expect(screen.getByText("lessons.exercises.correct")).toBeInTheDocument();
    expect(screen.queryByText("lessons.exercises.tryAgain")).not.toBeInTheDocument();
  });
});

const baseExercise: McqExercise = {
  id: "test-mcq",
  question: "What is the answer?",
  options: [
    { id: "a", text: "Option A" },
    { id: "b", text: "Option B" },
  ],
  correctOptionId: "a",
};

describe("MultipleChoice localization", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the English question by default", () => {
    render(<MultipleChoice exercise={baseExercise} />);
    expect(screen.getByText("What is the answer?")).toBeInTheDocument();
  });

  it("renders the Vietnamese question when language is vi and a vi translation exists", () => {
    mockI18n.language = "vi";
    render(
      <MultipleChoice
        exercise={{
          ...baseExercise,
          questionTranslations: { vi: "Câu trả lời là gì?" },
        }}
      />,
    );
    expect(screen.getByText("Câu trả lời là gì?")).toBeInTheDocument();
  });

  it("falls back to the English question when language is vi but no vi translation exists", () => {
    mockI18n.language = "vi";
    render(<MultipleChoice exercise={baseExercise} />);
    expect(screen.getByText("What is the answer?")).toBeInTheDocument();
  });
});
