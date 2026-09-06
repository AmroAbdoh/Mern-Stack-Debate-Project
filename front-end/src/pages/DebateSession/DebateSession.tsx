import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Button from "../../components/Button/Button";
import PageCard from "../../components/PageCard/PageCard";
import SessionForm from "../../components/SessionForm/SessionForm";
import {
  deleteSession,
  getSession,
  updateSession,
  type UpdateSessionRequest,
  type DebateSession as DebateSessionData,
} from "../../services/sessionAPI";
import "./debate-session.css";

function DebateSession() {
  const { id } = useParams();
  const [session, setSession] = useState<DebateSessionData | null>(null);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    getSession(id)
      .then(setSession)
      .catch(() => setMessage("We could not load this session."));
  }, [id]);

  const handleUpdate = async (payload: UpdateSessionRequest) => {
    if (!id) return;

    setIsSubmitting(true);
    setMessage("");
    try {
      setSession(await updateSession(id, payload));
      setIsEditing(false);
      setMessage("Session updated successfully.");
    } catch (error) {
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not update this session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Delete this debate session permanently?")) {
      return;
    }

    setIsDeleting(true);
    setMessage("");
    try {
      await deleteSession(id);
      window.location.assign("/home");
    } catch (error) {
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not delete this session.");
      setIsDeleting(false);
    }
  };

  if (!session) {
    return (
      <PageCard className="session-page-state">
        {message || "Loading session..."}
      </PageCard>
    );
  }

  if (isEditing) {
    return (
      <PageCard className="session-page">
        <Link className="back-link" to={`/sessions/${session._id}`}>
          Back to session
        </Link>
        <header className="session-header">
          <div>
            <span className="status">Edit session</span>
            <h1>{session.name}</h1>
            <p>Update the debate details and save your changes.</p>
          </div>
        </header>
        {message && <p className="session-message">{message}</p>}
        <SessionForm
          session={session}
          submitLabel="Save changes"
          submittingLabel="Saving changes..."
          isSubmitting={isSubmitting}
          onSubmit={(payload) => handleUpdate(payload as UpdateSessionRequest)}
        />
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            setMessage("");
            setIsEditing(false);
          }}
        >
          Cancel
        </Button>
      </PageCard>
    );
  }

  return (
    <PageCard className="session-page">
      <Link className="back-link" to="/home">
        Back to sessions
      </Link>

      <header className="session-header">
        <div>
          <span className="status">{session.status}</span>
          <h1>{session.name}</h1>
          <p>{session.statement}</p>
        </div>
        <div>
          <span className="format-badge">{session.format}</span>
        </div>
      </header>

      {message && (
        <p className="session-message session-message-success">{message}</p>
      )}

      <div className="session-details">
        <section className="session-section">
          <p className="section-label">Teams</p>
          <div className="teams-grid">
            {session.teams.map((team, index) => (
              <article className="team-card" key={team.name || index}>
                <span>{index === 0 ? "Team one" : "Team two"}</span>
                <h2>{team.name}</h2>
                <ul className="member-list">
                  {team.members.map((member) => (
                    <li key={member.name}>{member.name}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="session-section">
          <p className="section-label">Session details</p>
          <div className="meta-row">
            <span>Join code</span>
            <strong>{session.code}</strong>
          </div>
          <div className="meta-row">
            <span>Start time</span>
            <strong>{new Date(session.startTime).toLocaleString()}</strong>
          </div>
          <Link className="back-link" to={`/sessions/${id}/control`}>
            Open host controls
          </Link>
        </section>
        <div className="edit-actions">
          <Button type="button" onClick={() => setIsEditing(true)}>
            Edit session
          </Button>
          <Button
            className="delete-button"
            variant="ghost"
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete session"}
          </Button>
        </div>
      </div>
    </PageCard>
  );
}

export default DebateSession;
