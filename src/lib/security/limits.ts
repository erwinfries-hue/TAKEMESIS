/** Shared between client (OwnQuestionForm maxLength, UX only) and server (the actual enforcement) — see docs/OPEN_RISKS.md hardening notes. */
export const MAX_QUESTION_LENGTH = 500;

/** Same client/server split as MAX_QUESTION_LENGTH, for the report feedback widget's free-text comment. */
export const MAX_FEEDBACK_COMMENT_LENGTH = 1000;
