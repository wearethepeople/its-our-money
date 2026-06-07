/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import AllocateRoute from "./allocate";
import type { AllocationService } from "@/services/allocation-service.server.ts";

type ExistingAllocation = Awaited<
  ReturnType<typeof AllocationService.getAllocationByParticipantId>
>;

beforeAll(() => {
  // base-ui's Slider/Collapsible/Progress primitives measure their elements;
  // jsdom doesn't implement ResizeObserver.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderAllocateRoute(existingAllocation: ExistingAllocation | null) {
  const Stub = createRoutesStub([
    {
      path: "/allocate",
      Component: AllocateRoute,
      HydrateFallback: () => null,
      loader: () => ({ existingAllocation }),
    },
  ]);

  return render(<Stub initialEntries={["/allocate"]} />);
}

test("first-time participants see the initial comparison copy", async () => {
  renderAllocateRoute(null);

  expect(await screen.findByRole("heading", { name: "How's that feel?" })).toBeInTheDocument();
  expect(
    screen.getByText(/Now that you've set your priorities, they'll be mapped against/),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "See how your priorities compare" })).toBeInTheDocument();

  expect(screen.queryByRole("heading", { name: "Fine-tuning?" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Update your comparison" })).not.toBeInTheDocument();
});

test("returning participants see the fine-tuning copy", async () => {
  renderAllocateRoute({
    id: "allocation-1",
    publicId: null,
    participantId: "participant-1",
    items: [],
  } as unknown as ExistingAllocation);

  expect(await screen.findByRole("heading", { name: "Fine-tuning?" })).toBeInTheDocument();
  expect(
    screen.getByText("Adjust anything. Your updated priorities will replace the previous comparison."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Update your comparison" })).toBeInTheDocument();

  expect(screen.queryByRole("heading", { name: "How's that feel?" })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "See how your priorities compare" }),
  ).not.toBeInTheDocument();
});
