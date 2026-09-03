import "./session-control.css";
import PageCard from "../../components/PageCard/PageCard";
import Button from "../../components/Button/Button";
import SessionTimer from "../../components/SessionTimer/SessionTimer";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import {
  getSession,
  getVoteResults,
  updateSessionLifecycle,
  updateSessionStatus,
  type DebateSession,
  type LifecycleAction,
  type VoteResult,
} from "../../services/sessionAPI";

function SessionControl() {
  const { id } = useParams();
  const [session, setSession] = useState<DebateSession | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setSession(await getSession(id));
      } catch {
        setMessage("We could not load this session.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id]);

  useEffect(() => {
    if (
      !id ||
      !session ||
      !["pre-voting", "post-voting", "finished"].includes(session.status)
    ) {
      return;
    }

    getVoteResults(id)
      .then(setResults)
      .catch(() => undefined);
  }, [id, session]);

  useEffect(() => {
    if (!id) return;

    const interval = window.setInterval(() => {
      getSession(id)
        .then(setSession)
        .catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [id]);

  const handleAction = async (
    action: LifecycleAction | "start" | "pause" | "resume" | "cancel",
  ) => {
    if (!id) return;
    setIsUpdating(true);
    setMessage("");

    try {
      const updated =
        action === "start" ||
        action === "pause" ||
        action === "resume" ||
        action === "cancel"
          ? await updateSessionStatus(id, action)
          : await updateSessionLifecycle(id, action);
      setSession(updated);
      setMessage("Session updated.");
    } catch (error) {
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not update the session.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading)
    return (
      <PageCard className="control-state">Loading control room...</PageCard>
    );
  if (!session || !id)
    return (
      <PageCard className="control-state">
        <h1>Session unavailable</h1>
        <p>{message}</p>
      </PageCard>
    );

  const joinUrl = `${window.location.origin}/join/${session.code}`;
  const isVoting =
    session.status === "pre-voting" || session.status === "post-voting";

  return (
    <PageCard className="control-page">
      <div className="control-topbar">
        <Link to={`/sessions/${id}`}>Session details</Link>
        <span className={`control-status status-${session.status}`}>
          {session.status}
        </span>
      </div>

      <header className="control-header">
        <div>
          <p className="control-eyebrow">Host control room</p>
          <h1>{session.name}</h1>
          <p>{session.statement}</p>
        </div>
        <div className="session-code-block">
          <span>Join code</span>
          <strong>{session.code}</strong>
        </div>
      </header>

      {message && <p className="control-message">{message}</p>}

      <div className="control-layout">
        <section className="control-main">
          {session.status === "live" || session.status === "paused" ? (
            <SessionTimer
              endsAt={session.phaseEndsAt}
              label={
                session.activeTeam ? `${session.activeTeam} time` : "Phase time"
              }
            />
          ) : (
            <div className="phase-banner">
              <span>Current phase</span>
              <strong>{session.currentPhase || session.status}</strong>
            </div>
          )}

          <div className="control-actions">
            {session.status === "scheduled" && (
              <Button
                onClick={() => handleAction("start")}
                disabled={isUpdating}
              >
                Start session
              </Button>
            )}
            {session.status === "pre-voting" && (
              <Button
                onClick={() => handleAction("end-voting")}
                disabled={isUpdating}
              >
                End pre-voting
              </Button>
            )}
            {session.status === "live" && (
              <Button
                onClick={() => handleAction("end-debate")}
                disabled={isUpdating}
              >
                End debate
              </Button>
            )}
            {session.status === "paused" && (
              <Button
                onClick={() => handleAction("resume")}
                disabled={isUpdating}
              >
                Resume timer
              </Button>
            )}
            {session.status === "live" && (
              <Button
                variant="ghost"
                onClick={() => handleAction("pause")}
                disabled={isUpdating}
              >
                Pause timer
              </Button>
            )}
            {session.status === "post-voting" && (
              <Button
                onClick={() => handleAction("end-post-voting")}
                disabled={isUpdating}
              >
                Show final results
              </Button>
            )}
            {!["finished", "cancelled"].includes(session.status) && (
              <Button
                className="control-cancel"
                variant="ghost"
                onClick={() => handleAction("cancel")}
                disabled={isUpdating}
              >
                Cancel session
              </Button>
            )}
          </div>

          {isVoting && results.length > 0 && (
            <section className="results-panel">
              <p className="control-eyebrow">Live vote count</p>
              {results.map((result) => (
                <div
                  className="result-row"
                  key={`${result._id.phase}-${result._id.choice}`}
                >
                  <span>
                    {result._id.phase} · {result._id.choice}
                  </span>
                  <strong>{result.count}</strong>
                </div>
              ))}
            </section>
          )}
        </section>

        <aside className="share-panel">
          <div className="qr-wrap">
            <QRCodeSVG
              value={joinUrl}
              size={164}
              bgColor="#ffffff"
              fgColor="#274c77"
            />
          </div>
          <p>Scan to join the debate</p>
          <code>{joinUrl}</code>
          <Button
            className="copy-button"
            variant="ghost"
            onClick={() => void navigator.clipboard?.writeText(joinUrl)}
          >
            Copy join link
          </Button>
        </aside>
      </div>
    </PageCard>
  );
}

export default SessionControl;
