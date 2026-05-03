// src/components/exercises/__tests__/FillBlank.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FillBlank from "../FillBlank";
import type { FillBlankExercise } from "../exercises.types";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

const exercise: FillBlankExercise = {
  id: "fb-1",
  beforeBlank: "She",
  afterBlank: "a teacher.",
  correctAnswer: "is",
  acceptableAnswers: ["is"],
};

describe("FillBlank", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

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
    await user.click(screen.getByRole("button", { name: /lessons\.exercises\.check/i }));
    expect(screen.getByText("lessons.exercises.correct")).toBeInTheDocument();
  });

  it("shows incorrect feedback for a wrong answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "are");
    await user.click(screen.getByRole("button", { name: /lessons\.exercises\.check/i }));
    expect(screen.getByText("lessons.exercises.incorrect")).toBeInTheDocument();
  });

  it("is case-insensitive", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "Is");
    await user.click(screen.getByRole("button", { name: /lessons\.exercises\.check/i }));
    expect(screen.getByText("lessons.exercises.correct")).toBeInTheDocument();
  });

  it("shows Try again on incorrect and resets on click", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "are");
    await user.click(screen.getByRole("button", { name: /lessons\.exercises\.check/i }));
    expect(screen.getByText("lessons.exercises.tryAgain")).toBeInTheDocument();
    await user.click(screen.getByText("lessons.exercises.tryAgain"));
    // Input is re-enabled and cleared
    const input = screen.getByRole("textbox");
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue("");
    expect(screen.queryByText("lessons.exercises.incorrect")).not.toBeInTheDocument();
  });

  it("does not show Try again on correct answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "is");
    await user.click(screen.getByRole("button", { name: /lessons\.exercises\.check/i }));
    expect(screen.getByText("lessons.exercises.correct")).toBeInTheDocument();
    expect(screen.queryByText("lessons.exercises.tryAgain")).not.toBeInTheDocument();
  });
});

const scaffoldingOnly: FillBlankExercise = {
  id: "test-fb-scaffolding",
  beforeBlank: "Where",
  afterBlank: "they?",
  correctAnswer: "are",
};

const withInstruction: FillBlankExercise = {
  id: "test-fb-instruction",
  instruction: "Make this shorter:",
  instructionTranslations: { vi: "Rút gọn câu này:" },
  beforeBlank: "",
  afterBlank: "at home.",
  correctAnswer: "He's",
};

describe("FillBlank localization", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the English instruction paragraph when instruction is set", () => {
    render(<FillBlank exercise={withInstruction} />);
    expect(screen.getByText("Make this shorter:")).toBeInTheDocument();
  });

  it("does not render an instruction paragraph when instruction is undefined", () => {
    const { container } = render(<FillBlank exercise={scaffoldingOnly} />);
    // Sanity: scaffolding still renders.
    expect(screen.getByText("Where")).toBeInTheDocument();
    // The only <p> in this component is the instruction paragraph (post-submit
    // feedback uses <div>). No <p> should appear pre-submit.
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders the Vietnamese instruction when language is vi and a vi translation exists", () => {
    mockI18n.language = "vi";
    render(<FillBlank exercise={withInstruction} />);
    expect(screen.getByText("Rút gọn câu này:")).toBeInTheDocument();
  });
});
