// src/components/exercises/__tests__/FillBlank.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FillBlank from "../FillBlank";
import type { FillBlankExercise } from "../exercises.types";

const exercise: FillBlankExercise = {
  id: "fb-1",
  beforeBlank: "She",
  afterBlank: "a teacher.",
  correctAnswer: "is",
  acceptableAnswers: ["is"],
};

describe("FillBlank", () => {
  it("renders the sentence parts and an input", () => {
    render(<FillBlank exercise={exercise} />);
    expect(screen.getByText("She")).toBeInTheDocument();
    expect(screen.getByText("a teacher.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows correct feedback for the right answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "is");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows incorrect feedback for a wrong answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "are");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
  });

  it("is case-insensitive", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "Is");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows Try again on incorrect and resets on click", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "are");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Try again")).toBeInTheDocument();
    await user.click(screen.getByText("Try again"));
    // Input is re-enabled and cleared
    const input = screen.getByRole("textbox");
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue("");
    expect(screen.queryByText("Incorrect")).not.toBeInTheDocument();
  });

  it("does not show Try again on correct answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "is");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });
});
