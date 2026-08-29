import { useCallback, useReducer } from "react";
import type { ResumeDocument } from "../../domain/resume.types";

const HISTORY_LIMIT = 75;
const EDIT_GROUP_WINDOW_MS = 1_000;

export interface ResumeHistoryState {
  present: ResumeDocument | null;
  past: ResumeDocument[];
  future: ResumeDocument[];
  lastGroupKey: string | null;
  lastGroupTime: number;
}

type ResumeHistoryAction =
  | { type: "load"; resume: ResumeDocument | null }
  | {
      type: "update";
      update: (current: ResumeDocument) => ResumeDocument;
      groupKey?: string;
      timestamp: number;
    }
  | { type: "undo" }
  | { type: "redo" };

export const INITIAL_RESUME_HISTORY: ResumeHistoryState = {
  present: null,
  past: [],
  future: [],
  lastGroupKey: null,
  lastGroupTime: 0,
};

function appendBounded(history: ResumeDocument[], resume: ResumeDocument): ResumeDocument[] {
  return [...history, resume].slice(-HISTORY_LIMIT);
}

export function resumeHistoryReducer(
  state: ResumeHistoryState,
  action: ResumeHistoryAction,
): ResumeHistoryState {
  if (action.type === "load") {
    return { ...INITIAL_RESUME_HISTORY, present: action.resume };
  }

  if (action.type === "undo") {
    const previous = state.past.at(-1);
    if (!state.present || !previous) return state;
    return {
      present: previous,
      past: state.past.slice(0, -1),
      future: appendBounded(state.future, state.present),
      lastGroupKey: null,
      lastGroupTime: 0,
    };
  }

  if (action.type === "redo") {
    const next = state.future.at(-1);
    if (!state.present || !next) return state;
    return {
      present: next,
      past: appendBounded(state.past, state.present),
      future: state.future.slice(0, -1),
      lastGroupKey: null,
      lastGroupTime: 0,
    };
  }

  if (!state.present) return state;
  const next = action.update(state.present);
  if (next === state.present) return state;

  const continuesEditGroup = Boolean(
    action.groupKey
      && state.lastGroupKey === action.groupKey
      && action.timestamp - state.lastGroupTime <= EDIT_GROUP_WINDOW_MS,
  );

  return {
    present: next,
    past: continuesEditGroup ? state.past : appendBounded(state.past, state.present),
    future: [],
    lastGroupKey: action.groupKey ?? null,
    lastGroupTime: action.timestamp,
  };
}

export function useResumeHistory() {
  const [history, dispatch] = useReducer(resumeHistoryReducer, INITIAL_RESUME_HISTORY);
  const loadResume = useCallback(
    (resume: ResumeDocument | null) => dispatch({ type: "load", resume }),
    [],
  );
  const updateResume = useCallback((
    update: (current: ResumeDocument) => ResumeDocument,
    groupKey?: string,
  ) => dispatch({ type: "update", update, groupKey, timestamp: Date.now() }), []);
  const undoResume = useCallback(() => dispatch({ type: "undo" }), []);
  const redoResume = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    resume: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    loadResume,
    updateResume,
    undoResume,
    redoResume,
  };
}
