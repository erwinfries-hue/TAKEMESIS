/** Shared between client (OwnQuestionForm maxLength, UX only) and server (the actual enforcement) — see docs/OPEN_RISKS.md hardening notes. */
export const MAX_QUESTION_LENGTH = 500;

/** Same client/server split as MAX_QUESTION_LENGTH, for the report feedback widget's free-text comment. */
export const MAX_FEEDBACK_COMMENT_LENGTH = 1000;

/** Per IP per UTC day, on POST /api/topics/subscribe — abuse protection for a public, unauthenticated signup form. */
export const TOPIC_SUBSCRIBE_DAILY_LIMIT = 10;
