import { describe, expect, it } from "vitest";
import { createBlankResume } from "../domain/resume.defaults";
import {
  INITIAL_RESUME_HISTORY,
  resumeHistoryReducer,
} from "../features/editor/useResumeHistory";

describe("resume history", () => {
  it("undoes and redoes structural changes", () => {
    const resume = createBlankResume();
    let state = resumeHistoryReducer(INITIAL_RESUME_HISTORY, { type: "load", resume });
    state = resumeHistoryReducer(state, {
      type: "update",
      timestamp: 100,
      update: (current) => ({ ...current, sections: current.sections.slice(1) }),
    });

    expect(state.present?.sections).toHaveLength(resume.sections.length - 1);
    state = resumeHistoryReducer(state, { type: "undo" });
    expect(state.present?.sections).toHaveLength(resume.sections.length);
    state = resumeHistoryReducer(state, { type: "redo" });
    expect(state.present?.sections).toHaveLength(resume.sections.length - 1);
  });

  it("groups continuous typing and clears redo after a new change", () => {
    const resume = createBlankResume();
    let state = resumeHistoryReducer(INITIAL_RESUME_HISTORY, { type: "load", resume });
    const updateName = (fullName: string, timestamp: number) => {
      state = resumeHistoryReducer(state, {
        type: "update",
        groupKey: "personal:fullName",
        timestamp,
        update: (current) => ({
          ...current,
          personal: { ...current.personal, fullName },
        }),
      });
    };

    updateName("A", 100);
    updateName("Aa", 200);
    updateName("Aarav", 300);
    expect(state.past).toHaveLength(1);

    state = resumeHistoryReducer(state, { type: "undo" });
    expect(state.present?.personal.fullName).toBe(resume.personal.fullName);
    expect(state.future).toHaveLength(1);

    state = resumeHistoryReducer(state, {
      type: "update",
      timestamp: 2_000,
      update: (current) => ({ ...current, sections: current.sections.slice(1) }),
    });
    expect(state.future).toHaveLength(0);
  });
});
