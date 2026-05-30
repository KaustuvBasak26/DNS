import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SequenceRail } from "./SequenceRail";
import { sampleSteps } from "../test/fixtures";

describe("SequenceRail", () => {
  it("renders nothing without steps", () => {
    const { container } = render(
      <SequenceRail steps={[]} activeStep={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders hop cards with route labels", () => {
    render(<SequenceRail steps={sampleSteps} activeStep={1} />);
    expect(screen.getByText(/Hop sequence/i)).toBeInTheDocument();
    expect(screen.getByText(/Client → Resolver/)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
  });

  it("fires onSelectHop when a hop is clicked", async () => {
    const onSelectHop = vi.fn();
    const user = userEvent.setup();
    render(
      <SequenceRail
        steps={sampleSteps}
        activeStep={0}
        onSelectHop={onSelectHop}
      />
    );
    await user.click(screen.getByRole("button", { name: /Resolver → Root/i }));
    expect(onSelectHop).toHaveBeenCalledWith(1);
  });
});
