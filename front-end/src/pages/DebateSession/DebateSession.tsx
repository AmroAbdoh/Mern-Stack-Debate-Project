import "./debate-session.css";
import PageCard from "../../components/PageCard/PageCard";
import Button from "../../components/Button/Button";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  getSession,
  updateSessionStatus,
  type DebateSession as DebateSessionData,
} from "../../services/sessionAPI";

function DebateSession() {
  const { id } = useParams();
  const [session, setSession] = useState<DebateSessionData | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadSession = async () => {
      try {
        setSession(await getSession(id));
      } catch {
        setMessage("We could not find this debate session.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();
  }, [id]);

  const handleStatusChange = async (
    action: "start" | "pause" | "resume" | "cancel",
  ) => {
    if (!id) return;

    setIsUpdating(true);
    setMessage("");

    try {
      setSession(await updateSessionStatus(id, action));
    } catch (error) {
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not update this session.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <PageCard className="session-page-state">Loading session...</PageCard>
    );
  }

  if (!session) {
    return (
      <PageCard className="session-page-state">
        <h1>Session unavailable</h1>
        <p>{message}</p>
        <Link to="/home">Back to workspace</Link>
      </PageCard>
    );
  }

  const action =
    session.status === "scheduled"
      ? "start"
      : session.status === "live"
        ? "pause"
        : session.status === "paused"
          ? "resume"
          : null;

  return (
    <PageCard className="session-page">
      <Link className="back-link" to="/home">
        Back to workspace
      </Link>

      <header className="session-header">
        <div>
          <span className={`status status-${session.status}`}>
            {session.status}
          </span>
          <h1>{session.name}</h1>
          <p>{session.statement}</p>
        </div>
        <span className="format-badge">{session.format}</span>
      </header>

      {message && <p className="session-message">{message}</p>}

      <div className="session-details">
        <section className="session-section">
          <p className="section-label">The sides</p>
          <div className="teams-grid">
            {session.teams.map((team, index) => (
              <div className="team-card" key={team.name}>
                <span>Team {index + 1}</span>
                <h2>{team.name}</h2>
                {team.members.length > 0 && (
                  <ul className="member-list">
                    {team.members.map((member) => (
                      <li key={member.name}>{member.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="session-section session-meta">
          <p className="section-label">Session details</p>
          <div className="meta-row">
            <span>Starts</span>
            <strong>{new Date(session.startTime).toLocaleString()}</strong>
          </div>
          <div className="meta-row">
            <span>Format</span>
            <strong>
              {session.format === "PF" ? "Public Forum" : "Lincoln-Douglas"}
            </strong>
          </div>
        </section>
      </div>

      <footer className="session-actions">
        {action && (
          <Button
            type="button"
            disabled={isUpdating}
            onClick={() => handleStatusChange(action)}
          >
            {isUpdating
              ? "Updating..."
              : action === "start"
                ? "Start session"
                : action === "pause"
                  ? "Pause session"
                  : "Resume session"}
          </Button>
        )}
        {!["finished", "cancelled"].includes(session.status) && (
          <Button
            className="cancel-button"
            variant="ghost"
            type="button"
            disabled={isUpdating}
            onClick={() => handleStatusChange("cancel")}
          >
            Cancel session
          </Button>
        )}
      </footer>
    </PageCard>
  );
}

export default DebateSession;
