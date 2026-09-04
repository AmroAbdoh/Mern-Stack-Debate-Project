import "./home.css";
import PageCard from "../../components/PageCard/PageCard";
import Button from "../../components/Button/Button";
import SessionForm from "../../components/SessionForm/SessionForm";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  createSession,
  getSessions,
  type DebateSession,
  type CreateSessionRequest,
} from "../../services/sessionAPI";

function Home() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setSessions(await getSessions());
      } catch {
        setMessage("We could not load your sessions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadSessions();
  }, []);

  const handleCreate = async (payload: CreateSessionRequest) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const session = await createSession(payload);
      setSessions((current) => [...current, session]);
      setMessage("Your debate session was created successfully.");
    } catch (error) {
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(
        serverMessage ||
          "We could not create the session. Please check your details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    ["token", "userName", "userEmail", "userRole"].forEach((key) =>
      localStorage.removeItem(key),
    );
    navigate("/", { replace: true });
  };

  return (
    <PageCard className="home-card">
      <header className="home-header">
        <div>
          <p className="home-eyebrow">Host workspace</p>
          <h1>Shape the debate.</h1>
          <p>Build a focused room for your next serious discussion.</p>
        </div>
        <div className="session-count">
          <strong>{sessions.length}</strong>
          <span>sessions</span>
        </div>
        <Button
          className="logout-button"
          variant="ghost"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </header>

      {message && <p className="home-message">{message}</p>}

      <div className="home-layout">
        <section className="create-panel">
          <div className="panel-heading">
            <span>01</span>
            <h2>Create a debate session</h2>
          </div>
          <SessionForm
            submitLabel="Create session"
            submittingLabel="Creating session..."
            isSubmitting={isSubmitting}
            onSubmit={(payload) =>
              handleCreate(payload as CreateSessionRequest)
            }
          />
        </section>

        <section className="sessions-panel">
          <div className="panel-heading">
            <span>04</span>
            <h2>Your sessions</h2>
          </div>
          {isLoading ? (
            <p className="empty-state">Loading your sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="empty-state">
              Your created debate sessions will appear here.
            </p>
          ) : (
            <div className="session-list">
              {sessions.map((session) => (
                <Link
                  className="session-item"
                  key={session._id}
                  to={`/sessions/${session._id}`}
                >
                  <div>
                    <span className={`status status-${session.status}`}>
                      {session.status}
                    </span>
                    <h3>{session.name}</h3>
                    <p>{session.statement}</p>
                  </div>
                  <time dateTime={session.startTime}>
                    {new Date(session.startTime).toLocaleDateString()}
                  </time>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageCard>
  );
}

export default Home;
