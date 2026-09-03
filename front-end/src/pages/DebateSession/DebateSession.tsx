import "./debate-session.css";
import PageCard from "../../components/PageCard/PageCard";
import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/Input";
import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  getSession,
  updateSession,
  updateSessionStatus,
  type DebateSession as DebateSessionData,
} from "../../services/sessionAPI";

type EditableTeams = [
  { name: string; members: { name: string }[] },
  { name: string; members: { name: string }[] },
];

function DebateSession() {
  const { id } = useParams();
  const [session, setSession] = useState<DebateSessionData | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    statement: "",
    format: "PF" as "PF" | "LD",
    startTime: "",
  });
  const [editTeams, setEditTeams] = useState<EditableTeams>([
    { name: "", members: [{ name: "" }] },
    { name: "", members: [{ name: "" }] },
  ]);

  useEffect(() => {
    if (!id) return;

    const loadSession = async () => {
      try {
        const loadedSession = await getSession(id);
        setSession(loadedSession);
        setEditData({
          name: loadedSession.name,
          statement: loadedSession.statement,
          format: loadedSession.format,
          startTime: loadedSession.startTime.slice(0, 16),
        });
        setEditTeams([
          {
            name: loadedSession.teams[0].name,
            members: loadedSession.teams[0].members.map((member) => ({
              name: member.name,
            })),
          },
          {
            name: loadedSession.teams[1].name,
            members: loadedSession.teams[1].members.map((member) => ({
              name: member.name,
            })),
          },
        ]);
      } catch {
        setMessageType("error");
        setMessage("We could not find this debate session.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();
  }, [id]);

  const handleEditChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditData((current) => ({ ...current, [name]: value }));
  };

  const updateTeam = (
    teamIndex: 0 | 1,
    field: "name" | "member",
    value: string,
    memberIndex = 0,
  ) => {
    setEditTeams((current) => {
      const teams = [...current] as EditableTeams;

      if (field === "name") {
        teams[teamIndex] = { ...teams[teamIndex], name: value };
      } else {
        const members = [...teams[teamIndex].members];
        members[memberIndex] = { name: value };
        teams[teamIndex] = { ...teams[teamIndex], members };
      }

      return teams;
    });
  };

  const addTeamMember = (teamIndex: 0 | 1) => {
    setEditTeams((current) => {
      const teams = [...current] as EditableTeams;
      teams[teamIndex] = {
        ...teams[teamIndex],
        members: [...teams[teamIndex].members, { name: "" }],
      };
      return teams;
    });
  };

  const removeTeamMember = (teamIndex: 0 | 1, memberIndex: number) => {
    setEditTeams((current) => {
      const teams = [...current] as EditableTeams;
      const members = teams[teamIndex].members.filter(
        (_, index) => index !== memberIndex,
      );
      teams[teamIndex] = {
        ...teams[teamIndex],
        members: members.length > 0 ? members : [{ name: "" }],
      };
      return teams;
    });
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    setIsUpdating(true);
    setMessage("");

    try {
      const updatedSession = await updateSession(id, {
        ...editData,
        teams: [
          {
            ...editTeams[0],
            members: editTeams[0].members.filter((member) =>
              member.name.trim(),
            ),
          },
          {
            ...editTeams[1],
            members: editTeams[1].members.filter((member) =>
              member.name.trim(),
            ),
          },
        ],
      });
      setSession(updatedSession);
      setIsEditing(false);
      setMessageType("success");
      setMessage("Session details updated successfully.");
    } catch (error) {
      setMessageType("error");
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not save the session details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (
    action: "start" | "pause" | "resume" | "cancel",
  ) => {
    if (!id) return;

    setIsUpdating(true);
    setMessage("");

    try {
      setSession(await updateSessionStatus(id, action));
    } catch (error) {
      setMessageType("error");
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setMessage(serverMessage || "We could not update this session.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Cancel this debate session? This cannot be undone.")) {
      void handleStatusChange("cancel");
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
          {isEditing ? (
            <form className="session-edit-form" onSubmit={handleEditSubmit}>
              <InputField
                label="Session name"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
              />
              <InputField
                label="Statement"
                name="statement"
                value={editData.statement}
                onChange={handleEditChange}
              />
              <div className="session-edit-row">
                <label className="session-select-field">
                  Format
                  <select
                    value={editData.format}
                    onChange={(event) =>
                      setEditData((current) => ({
                        ...current,
                        format: event.target.value as "PF" | "LD",
                      }))
                    }
                  >
                    <option value="PF">Public Forum</option>
                    <option value="LD">Lincoln-Douglas</option>
                  </select>
                </label>
                <label className="session-select-field">
                  Start time
                  <input
                    name="startTime"
                    type="datetime-local"
                    value={editData.startTime}
                    onChange={handleEditChange}
                    required
                  />
                </label>
              </div>
              <div className="edit-actions">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h1>{session.name}</h1>
              <p>{session.statement}</p>
            </>
          )}
        </div>
        <span className="format-badge">{session.format}</span>
      </header>

      {message && (
        <p className={`session-message session-message-${messageType}`}>
          {message}
        </p>
      )}

      <div className="session-details">
        <section className="session-section">
          <p className="section-label">The sides</p>
          <div className="teams-grid">
            {session.teams.map((team, index) => (
              <div className="team-card" key={team.name}>
                <span>Team {index + 1}</span>
                {isEditing ? (
                  <div className="team-edit-form">
                    <InputField
                      label="Team name"
                      name={`team-${index}-name`}
                      value={editTeams[index].name}
                      onChange={(event) =>
                        updateTeam(index as 0 | 1, "name", event.target.value)
                      }
                    />
                    <div className="team-member-edit-heading">
                      <span>Members</span>
                      <Button
                        className="add-team-member"
                        variant="ghost"
                        type="button"
                        onClick={() => addTeamMember(index as 0 | 1)}
                      >
                        + Add
                      </Button>
                    </div>
                    {editTeams[index].members.map((member, memberIndex) => (
                      <div
                        className="team-member-input"
                        key={`${index}-${memberIndex}`}
                      >
                        <InputField
                          label={`Member ${memberIndex + 1}`}
                          name={`team-${index}-member-${memberIndex}`}
                          value={member.name}
                          placeholder="Member name"
                          onChange={(event) =>
                            updateTeam(
                              index as 0 | 1,
                              "member",
                              event.target.value,
                              memberIndex,
                            )
                          }
                        />
                        {editTeams[index].members.length > 1 && (
                          <Button
                            className="remove-team-member"
                            variant="ghost"
                            type="button"
                            onClick={() =>
                              removeTeamMember(index as 0 | 1, memberIndex)
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <h2>{team.name}</h2>
                )}
                {!isEditing && team.members.length > 0 && (
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

      {!isEditing && (
        <footer className="session-actions">
          {!["finished", "cancelled"].includes(session.status) && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit session
            </Button>
          )}
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
              onClick={handleCancel}
            >
              Cancel session
            </Button>
          )}
        </footer>
      )}
    </PageCard>
  );
}

export default DebateSession;
