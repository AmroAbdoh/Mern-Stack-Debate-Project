import "./home.css";
import PageCard from "../../components/PageCard/PageCard";
import InputField from "../../components/InputField/Input";
import Button from "../../components/Button/Button";
import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  createSession,
  getSessions,
  type DebateSession,
} from "../../services/sessionAPI";

function Home() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    statement: "",
    format: "PF" as "PF" | "LD",
    teamOne: "",
    teamTwo: "",
    teamOneMembers: [""],
    teamTwoMembers: [""],
    startTime: "",
  });

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const updateMember = (
    team: "teamOneMembers" | "teamTwoMembers",
    index: number,
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [team]: current[team].map((member, memberIndex) =>
        memberIndex === index ? value : member,
      ),
    }));
  };

  const addMember = (team: "teamOneMembers" | "teamTwoMembers") => {
    setFormData((current) => ({
      ...current,
      [team]: [...current[team], ""],
    }));
  };

  const removeMember = (
    team: "teamOneMembers" | "teamTwoMembers",
    index: number,
  ) => {
    setFormData((current) => ({
      ...current,
      [team]: current[team].filter((_, memberIndex) => memberIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const session = await createSession({
        name: formData.name,
        statement: formData.statement,
        format: formData.format,
        teams: [
          {
            name: formData.teamOne,
            members: formData.teamOneMembers
              .filter((member) => member.trim())
              .map((name) => ({ name: name.trim() })),
          },
          {
            name: formData.teamTwo,
            members: formData.teamTwoMembers
              .filter((member) => member.trim())
              .map((name) => ({ name: name.trim() })),
          },
        ],
        startTime: formData.startTime,
      });

      setSessions((current) => [...current, session]);
      setFormData({
        name: "",
        statement: "",
        format: "PF",
        teamOne: "",
        teamTwo: "",
        teamOneMembers: [""],
        teamTwoMembers: [""],
        startTime: "",
      });
      setMessage("Your debate session was created successfully.");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage(
          "We could not create the session. Please check your details.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
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

          <form className="session-form" onSubmit={handleSubmit}>
            <InputField
              label="Session name"
              name="name"
              value={formData.name}
              placeholder="e.g. Future of remote work"
              onChange={handleChange}
            />
            <InputField
              label="Debate statement"
              name="statement"
              value={formData.statement}
              placeholder="e.g. Remote work should be the default"
              onChange={handleChange}
            />

            <div className="form-row">
              <label className="select-field">
                Format
                <select
                  name="format"
                  value={formData.format}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      format: event.target.value as "PF" | "LD",
                    }))
                  }
                >
                  <option value="PF">Public Forum</option>
                  <option value="LD">Lincoln-Douglas</option>
                </select>
              </label>
              <label className="select-field">
                Start time
                <input
                  name="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="team-fields">
              <InputField
                label="Team one"
                name="teamOne"
                value={formData.teamOne}
                placeholder="Affirmative"
                onChange={handleChange}
              />
              <InputField
                label="Team two"
                name="teamTwo"
                value={formData.teamTwo}
                placeholder="Negative"
                onChange={handleChange}
              />
            </div>

            <div className="members-fields">
              <div className="member-group">
                <div className="member-heading">
                  <span>Team one members</span>
                  <Button
                    className="add-member-button"
                    variant="ghost"
                    type="button"
                    onClick={() => addMember("teamOneMembers")}
                  >
                    + Add member
                  </Button>
                </div>
                {formData.teamOneMembers.map((member, index) => (
                  <div className="member-input" key={`team-one-${index}`}>
                    <InputField
                      label={`Member ${index + 1}`}
                      name={`team-one-member-${index}`}
                      value={member}
                      placeholder="Member name"
                      onChange={(event) =>
                        updateMember(
                          "teamOneMembers",
                          index,
                          event.target.value,
                        )
                      }
                    />
                    {formData.teamOneMembers.length > 1 && (
                      <Button
                        className="remove-member-button"
                        variant="ghost"
                        type="button"
                        aria-label={`Remove team one member ${index + 1}`}
                        onClick={() => removeMember("teamOneMembers", index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="member-group">
                <div className="member-heading">
                  <span>Team two members</span>
                  <Button
                    className="add-member-button"
                    variant="ghost"
                    type="button"
                    onClick={() => addMember("teamTwoMembers")}
                  >
                    + Add member
                  </Button>
                </div>
                {formData.teamTwoMembers.map((member, index) => (
                  <div className="member-input" key={`team-two-${index}`}>
                    <InputField
                      label={`Member ${index + 1}`}
                      name={`team-two-member-${index}`}
                      value={member}
                      placeholder="Member name"
                      onChange={(event) =>
                        updateMember(
                          "teamTwoMembers",
                          index,
                          event.target.value,
                        )
                      }
                    />
                    {formData.teamTwoMembers.length > 1 && (
                      <Button
                        className="remove-member-button"
                        variant="ghost"
                        type="button"
                        aria-label={`Remove team two member ${index + 1}`}
                        onClick={() => removeMember("teamTwoMembers", index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="create-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating session..." : "Create session"}
            </Button>
          </form>
        </section>

        <section className="sessions-panel">
          <div className="panel-heading">
            <span>02</span>
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
