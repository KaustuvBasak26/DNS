import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HopDetailsPanel } from "./HopDetailsPanel";
import { sampleSteps } from "../test/fixtures";

describe("HopDetailsPanel", () => {
  it("shows empty state before resolve", () => {
    render(<HopDetailsPanel steps={[]} activeStep={0} />);
    expect(screen.getByText(/Hop-by-hop trace/i)).toBeInTheDocument();
    expect(screen.getByText("Resolve", { exact: false })).toBeInTheDocument();
  });

  it("shows current hop details and final answer", () => {
    render(
      <HopDetailsPanel
        steps={sampleSteps}
        activeStep={2}
        domain="blog.example.com"
        answer="93.184.216.34"
      />
    );
    expect(screen.getByText(/Resolution complete/i)).toBeInTheDocument();
    expect(screen.getByText("Final answer")).toBeInTheDocument();
    expect(screen.getAllByText("93.184.216.34").length).toBeGreaterThan(0);
    expect(screen.getByText(/Recursive Resolver/)).toBeInTheDocument();
    expect(screen.getByText(/Browser \/ Client/)).toBeInTheDocument();
  });

  it("calls onSelectHop when timeline hop clicked", async () => {
    const onSelectHop = vi.fn();
    const user = userEvent.setup();
    render(
      <HopDetailsPanel
        steps={sampleSteps}
        activeStep={0}
        onSelectHop={onSelectHop}
      />
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);
    expect(onSelectHop).toHaveBeenCalledWith(1);
  });
});
