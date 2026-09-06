import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export type SessionStatus =
  | "scheduled"
  | "waiting"
  | "pre-voting"
  | "live"
  | "paused"
  | "post-voting"
  | "finished"
  | "cancelled";

export type DebateSession = {
  _id: string;
  participantCount?: number;
  code: string;
  name: string;
  statement: string;
  format: "PF" | "LD" | "Custom";
  teams: [
    { name: string; members: { name: string; contactInfo?: string }[] },
    { name: string; members: { name: string; contactInfo?: string }[] },
  ];
  startTime: string;
  status: SessionStatus;
  currentPhase?: "pre-voting" | "debate" | "post-voting";
  currentPhaseIndex?: number;
  activeTeam?: "teamOne" | "teamTwo";
  phaseStartedAt?: string;
  phaseEndsAt?: string;
  settings?: {
    allowAbstain: boolean;
    preDebateVoting: boolean;
    postDebateVoting: boolean;
    autoShowResults: boolean;
  };
  phases?: {
    name: string;
    duration: number;
    durationSeconds?: number;
    timingMode: "per-team" | "team-one" | "team-two" | "shared";
    order: number;
  }[];
};

export type CreateSessionRequest = {
  name: string;
  statement: string;
  format: "PF" | "LD" | "Custom";

  teams: [
    { name: string; members: { name: string }[] },
    { name: string; members: { name: string }[] },
  ];

  startTime: string;

  settings: {
    allowAbstain: boolean;
    preDebateVoting: boolean;
    postDebateVoting: boolean;
    autoShowResults: boolean;
  };

  phases: {
    name: string;
    duration: number;
    timingMode: "per-team" | "team-one" | "team-two" | "shared";
    order: number;
  }[];
};

export type UpdateSessionRequest = Pick<
  CreateSessionRequest,
  | "name"
  | "statement"
  | "format"
  | "startTime"
  | "teams"
  | "settings"
  | "phases"
>;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const voterToken = () => {
  const existing = localStorage.getItem("voterToken");
  if (existing) return existing;

  const token = crypto.randomUUID();
  localStorage.setItem("voterToken", token);
  return token;
};

const participationHeaders = () => ({
  ...authHeaders(),
  "X-Voter-Token": voterToken(),
});

export const createSession = async (payload: CreateSessionRequest) => {
  const response = await api.post<{ session: DebateSession }>(
    "/sessions",
    payload,
    { headers: authHeaders() },
  );

  return response.data.session;
};

export const getSessions = async () => {
  const response = await api.get<{ sessions: DebateSession[] }>("/sessions", {
    headers: authHeaders(),
  });

  return response.data.sessions;
};

export const getSession = async (id: string) => {
  const response = await api.get<{
    session: DebateSession;
    participantCount: number;
  }>(`/sessions/${id}`, {
    headers: authHeaders(),
  });

  return {
    ...response.data.session,
    participantCount: response.data.participantCount,
  };
};

export const updateSession = async (
  id: string,
  payload: UpdateSessionRequest,
) => {
  const response = await api.patch<{ session: DebateSession }>(
    `/sessions/${id}`,
    payload,
    { headers: authHeaders() },
  );

  return response.data.session;
};

export const deleteSession = async (id: string) => {
  await api.delete(`/sessions/${id}`, { headers: authHeaders() });
};

export const updateSessionStatus = async (
  id: string,
  action: "start" | "pause" | "resume" | "cancel",
) => {
  const response = await api.patch<{ session: DebateSession }>(
    `/sessions/${id}/${action}`,
    {},
    { headers: authHeaders() },
  );

  return response.data.session;
};

export type LifecycleAction =
  | "begin-voting"
  | "end-voting"
  | "end-debate"
  | "end-post-voting";

export const updateSessionLifecycle = async (
  id: string,
  action: LifecycleAction,
) => {
  const response = await api.patch<{ session: DebateSession }>(
    `/sessions/${id}/${action}`,
    {},
    { headers: authHeaders() },
  );

  return response.data.session;
};

export const getSessionByCode = async (code: string) => {
  const response = await api.get<{
    session: DebateSession;
    participantCount: number;
  }>(`/sessions/code/${code}`, { headers: participationHeaders() });

  return {
    ...response.data.session,
    participantCount: response.data.participantCount,
  };
};

export type VoteChoice = "teamOne" | "teamTwo" | "abstain";

export const submitVote = async (id: string, choice: VoteChoice) => {
  const response = await api.post<{ message: string }>(
    `/sessions/${id}/votes`,
    { choice },
    { headers: participationHeaders() },
  );

  return response.data;
};

export type VoteResult = {
  _id: { phase: "pre" | "post"; choice: VoteChoice };
  count: number;
};

export const getVoteResults = async (id: string) => {
  const response = await api.get<{ results: VoteResult[] }>(
    `/sessions/${id}/votes/results`,
    { headers: participationHeaders() },
  );

  return response.data.results;
};
