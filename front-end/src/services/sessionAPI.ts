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
  code: string;
  name: string;
  statement: string;
  format: "PF" | "LD";
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
  phases?: { name: string; duration: number; order: number }[];
};

export type CreateSessionRequest = {
  name: string;
  statement: string;
  format: "PF" | "LD";
  teams: [
    { name: string; members: { name: string }[] },
    { name: string; members: { name: string }[] },
  ];
  startTime: string;
};

export type UpdateSessionRequest = Pick<
  CreateSessionRequest,
  "name" | "statement" | "format" | "startTime" | "teams"
>;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
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
  const response = await api.get<{ session: DebateSession }>(
    `/sessions/${id}`,
    {
      headers: authHeaders(),
    },
  );

  return response.data.session;
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
  const response = await api.get<{ session: DebateSession }>(
    `/sessions/code/${code}`,
    { headers: authHeaders() },
  );

  return response.data.session;
};

export type VoteChoice = "teamOne" | "teamTwo" | "abstain";

export const submitVote = async (id: string, choice: VoteChoice) => {
  const response = await api.post<{ message: string }>(
    `/sessions/${id}/votes`,
    { choice },
    { headers: authHeaders() },
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
    { headers: authHeaders() },
  );

  return response.data.results;
};
