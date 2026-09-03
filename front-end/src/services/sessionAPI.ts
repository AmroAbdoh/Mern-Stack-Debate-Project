import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export type SessionStatus =
  | "scheduled"
  | "live"
  | "paused"
  | "finished"
  | "cancelled";

export type DebateSession = {
  _id: string;
  name: string;
  statement: string;
  format: "PF" | "LD";
  teams: [
    { name: string; members: { name: string; contactInfo?: string }[] },
    { name: string; members: { name: string; contactInfo?: string }[] },
  ];
  startTime: string;
  status: SessionStatus;
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
