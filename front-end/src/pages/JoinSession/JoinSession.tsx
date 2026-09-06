import "./join-session.css";
import PageCard from "../../components/PageCard/PageCard";
import Button from "../../components/Button/Button";
import SessionTimer from "../../components/SessionTimer/SessionTimer";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  getSessionByCode,
  getVoteResults,
  submitVote,
  type DebateSession,
  type VoteChoice,
  type VoteResult,
} from "../../services/sessionAPI";

function JoinSession() {
  const { code } = useParams();
  const [session, setSession] = useState<DebateSession | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (!code) return;

    const load = async () => {
      try {
        setSession(await getSessionByCode(code));
      } catch {
        setMessage("We could not find a session with that code.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [code]);

  useEffect(() => {
    if (!code) return;

    const interval = window.setInterval(() => {
      getSessionByCode(code)
        .then(setSession)
        .catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [code]);

  useEffect(() => {
    if (!session || !["post-voting", "finished"].includes(session.status))
      return;
    getVoteResults(session._id)
      .then(setResults)
      .catch(() => undefined);
  }, [session]);

  const handleVote = async () => {
    if (!session || !selectedVote) return;

    setIsVoting(true);
    try {
      const response = await submitVote(session._id, selectedVote);
      setMessage(response.message);
    } catch (error) {
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not record your vote.");
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading)
    return <PageCard className="join-state">Loading debate room...</PageCard>;
  if (!session)
    return (
      <PageCard className="join-state">
        <h1>Room unavailable</h1>
        <p>{message}</p>
        <Link to="/">Back home</Link>
      </PageCard>
    );

  const isVotingOpen =
    session.status === "pre-voting" || session.status === "post-voting";
  const phaseLabel =
    session.status === "pre-voting" ? "Pre-debate vote" : "Post-debate vote";

  return (
    <PageCard className="join-page">
      <Link className="join-back-link" to="/">
        Leave room
      </Link>
      <header className="join-header">
        <div>
          <p className="join-eyebrow">Debate room · {session.code}</p>
          <h1>{session.name}</h1>
          <p>{session.statement}</p>
        </div>
        <span className={`join-status status-${session.status}`}>
          {session.status}
        </span>
      </header>

      {message && <p className="join-message">{message}</p>}

      {session.status === "waiting" || session.status === "scheduled" ? (
        <div className="join-waiting">
          <strong>Waiting for the host</strong>
          <span>The debate will begin when the host starts the room.</span>
        </div>
      ) : isVotingOpen ? (
        <section className="vote-panel">
          <p className="join-eyebrow">{phaseLabel}</p>
          <h2>Which side has your vote?</h2>
          <div className="vote-options">
            <button
              className={selectedVote === "teamOne" ? "selected" : ""}
              type="button"
              onClick={() => setSelectedVote("teamOne")}
            >
              {session.teams[0].name}
            </button>
            <button
              className={selectedVote === "teamTwo" ? "selected" : ""}
              type="button"
              onClick={() => setSelectedVote("teamTwo")}
            >
              {session.teams[1].name}
            </button>
            {session.settings?.allowAbstain && (
              <button
                className={selectedVote === "abstain" ? "selected" : ""}
                type="button"
                onClick={() => setSelectedVote("abstain")}
              >
                Abstain
              </button>
            )}
          </div>
          <Button disabled={!selectedVote || isVoting} onClick={handleVote}>
            {isVoting ? "Recording..." : "Submit vote"}
          </Button>
        </section>
      ) : session.status === "live" || session.status === "paused" ? (
        <section className="live-panel">
          <p className="join-eyebrow">Watch the debate</p>
          <h2>The debate is in progress.</h2>
          <p>Please watch the screen and follow the current phase.</p>
          <SessionTimer
            endsAt={session.phaseEndsAt}
            paused={session.status === "paused"}
            label={
              session.activeTeam === "teamOne"
                ? "Team 1 speaking"
                : session.activeTeam === "teamTwo"
                  ? "Team 2 speaking"
                  : "Current phase"
            }
          />
        </section>
      ) : (
        <section className="results-panel participant-results">
          <p className="join-eyebrow">Final results</p>
          <h2>The debate has finished.</h2>
          {results.length === 0 ? (
            <p>Results are not available yet.</p>
          ) : (
            results.map((result) => (
              <div
                className="participant-result"
                key={`${result._id.phase}-${result._id.choice}`}
              >
                <span>
                  {result._id.phase === "pre"
                    ? "Pre-debate · "
                    : "Post-debate · "}
                  {result._id.choice === "teamOne"
                    ? session.teams[0].name
                    : result._id.choice === "teamTwo"
                      ? session.teams[1].name
                      : "Abstain"}
                </span>
                <strong>
                  {result.count} (
                  {(() => {
                    const phaseTotal = results
                      .filter(
                        (phaseResult) =>
                          phaseResult._id.phase === result._id.phase,
                      )
                      .reduce((sum, phaseResult) => sum + phaseResult.count, 0);
                    return phaseTotal
                      ? Math.round((result.count / phaseTotal) * 100)
                      : 0;
                  })()}
                  %)
                </strong>
              </div>
            ))
          )}
        </section>
      )}

      <div className="join-teams">
        {session.teams.map((team) => (
          <div key={team.name}>
            <span>Team</span>
            <strong>{team.name}</strong>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

export default JoinSession;
