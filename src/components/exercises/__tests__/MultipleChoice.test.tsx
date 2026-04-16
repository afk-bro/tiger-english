// src/components/exercises/__tests__/MultipleChoice.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultipleChoice from "../MultipleChoice";
import type { McqExercise } from "../exercises.types";

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
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows incorrect feedback when wrong option is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
  });

  it("disables options after an answer is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
