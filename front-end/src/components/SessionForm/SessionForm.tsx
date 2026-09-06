import "./session-form.css";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../Button/Button";
import InputField from "../InputField/Input";
import type {
  CreateSessionRequest,
  DebateSession,
  UpdateSessionRequest,
} from "../../services/sessionAPI";

type Phase = CreateSessionRequest["phases"][number];
type SessionFormat = CreateSessionRequest["format"];
type FormData = Omit<CreateSessionRequest, "teams"> & {
  teams: CreateSessionRequest["teams"];
};

const formatTemplates: Record<
  Exclude<SessionFormat, "Custom">,
  Pick<FormData, "teams" | "phases">
> = {
  PF: {
    teams: [
      { name: "Affirmative", members: [{ name: "" }, { name: "" }] },
      { name: "Negative", members: [{ name: "" }, { name: "" }] },
    ],
    phases: [
      { name: "Constructive", duration: 4, timingMode: "per-team", order: 1 },
      { name: "Rebuttal", duration: 4, timingMode: "per-team", order: 2 },
      { name: "Summary", duration: 3, timingMode: "per-team", order: 3 },
      { name: "Final Focus", duration: 2, timingMode: "per-team", order: 4 },
    ],
  },
  LD: {
    teams: [
      { name: "Affirmative", members: [{ name: "" }] },
      { name: "Negative", members: [{ name: "" }] },
    ],
    phases: [
      {
        name: "Affirmative Constructive",
        duration: 6,
        timingMode: "team-one",
        order: 1,
      },
      {
        name: "Cross-Examination",
        duration: 3,
        timingMode: "shared",
        order: 2,
      },
      {
        name: "Negative Constructive",
        duration: 7,
        timingMode: "team-two",
        order: 3,
      },
      {
        name: "Cross-Examination",
        duration: 3,
        timingMode: "shared",
        order: 4,
      },
      {
        name: "Affirmative Rebuttal",
        duration: 4,
        timingMode: "team-one",
        order: 5,
      },
      {
        name: "Negative Rebuttal",
        duration: 6,
        timingMode: "team-two",
        order: 6,
      },
      {
        name: "Affirmative Final Rebuttal",
        duration: 3,
        timingMode: "team-one",
        order: 7,
      },
    ],
  },
};

const getDefaultSessionFormData = (): FormData => ({
  name: "",
  statement: "",
  format: "PF",
  ...formatTemplates.PF,
  startTime: "",
  settings: {
    allowAbstain: false,
    preDebateVoting: false,
    postDebateVoting: true,
    autoShowResults: true,
  },
});

const toFormData = (session?: DebateSession): FormData => {
  if (!session) return getDefaultSessionFormData();

  const defaults = getDefaultSessionFormData();
  return {
    name: session.name,
    statement: session.statement,
    format: session.format,
    teams: session.teams.map((team) => ({
      name: team.name,
      members: team.members.length
        ? team.members.map(({ name }) => ({ name }))
        : [{ name: "" }],
    })) as FormData["teams"],
    startTime: session.startTime.slice(0, 16),
    settings: { ...defaults.settings, ...session.settings },
    phases: session.phases?.length
      ? session.phases.map(({ name, duration, timingMode, order }) => ({
          name,
          duration,
          timingMode,
          order,
        }))
      : defaults.phases,
  };
};

type SessionFormProps = {
  session?: DebateSession;
  submitLabel?: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (
    payload: CreateSessionRequest | UpdateSessionRequest,
  ) => void | Promise<void>;
};

function SessionForm({
  session,
  submitLabel = "Create session",
  submittingLabel = "Saving...",
  isSubmitting = false,
  onSubmit,
}: SessionFormProps) {
  const [formData, setFormData] = useState(() => toFormData(session));
  const [message, setMessage] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const updateTeam = (teamIndex: 0 | 1, name: string) => {
    setFormData((current) => {
      const teams = [...current.teams] as FormData["teams"];
      teams[teamIndex] = { ...teams[teamIndex], name };
      return { ...current, teams };
    });
  };

  const updateMember = (
    teamIndex: 0 | 1,
    memberIndex: number,
    name: string,
  ) => {
    setFormData((current) => {
      const teams = [...current.teams] as FormData["teams"];
      const members = [...teams[teamIndex].members];
      members[memberIndex] = { name };
      teams[teamIndex] = { ...teams[teamIndex], members };
      return { ...current, teams };
    });
  };

  const addMember = (teamIndex: 0 | 1) => {
    setFormData((current) => {
      const teams = [...current.teams] as FormData["teams"];
      teams[teamIndex] = {
        ...teams[teamIndex],
        members: [...teams[teamIndex].members, { name: "" }],
      };
      return { ...current, format: "Custom", teams };
    });
  };

  const removeMember = (teamIndex: 0 | 1, memberIndex: number) => {
    setFormData((current) => {
      const teams = [...current.teams] as FormData["teams"];
      const members = teams[teamIndex].members.filter(
        (_, index) => index !== memberIndex,
      );
      teams[teamIndex] = {
        ...teams[teamIndex],
        members: members.length ? members : [{ name: "" }],
      };
      return { ...current, format: "Custom", teams };
    });
  };

  const updatePhase = (
    index: number,
    field: keyof Phase,
    value: string | number,
  ) => {
    setFormData((current) => ({
      ...current,
      format: "Custom",
      phases: current.phases.map((phase, phaseIndex) =>
        phaseIndex === index ? { ...phase, [field]: value } : phase,
      ),
    }));
  };

  const changeFormat = (format: SessionFormat) => {
    setFormData((current) => {
      if (format === "Custom") {
        return { ...current, format };
      }

      return { ...current, format, ...formatTemplates[format] };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!formData.phases.length) {
      setMessage("Please add at least one debate phase.");
      return;
    }

    if (
      formData.phases.some((phase) => !phase.name.trim() || phase.duration < 1)
    ) {
      setMessage(
        "Every phase needs a name and a duration of at least 1 minute.",
      );
      return;
    }

    const payload = {
      ...formData,
      settings: { ...formData.settings, postDebateVoting: true },
      teams: formData.teams.map((team) => ({
        name: team.name.trim(),
        members: team.members
          .filter((member) => member.name.trim())
          .map((member) => ({
            name: member.name.trim(),
          })),
      })) as FormData["teams"],
      phases: formData.phases.map((phase, index) => ({
        ...phase,
        name: phase.name.trim(),
        duration: Number(phase.duration),
        order: index + 1,
      })),
    };

    await onSubmit(payload);
  };

  return (
    <form className="session-form" onSubmit={handleSubmit}>
      {message && <p className="form-message">{message}</p>}
      <InputField
        label="Session name"
        name="name"
        value={formData.name}
        placeholder="e.g. Future of remote work"
        onChange={handleChange}
        required
      />
      <InputField
        label="Debate statement"
        name="statement"
        value={formData.statement}
        placeholder="e.g. Remote work should be the default"
        onChange={handleChange}
        required
      />

      <div className="form-row">
        <label className="select-field">
          Format
          <select
            value={formData.format}
            onChange={(event) =>
              changeFormat(event.target.value as SessionFormat)
            }
          >
            <option value="PF">Public Forum</option>
            <option value="LD">Lincoln-Douglas</option>
            <option value="Custom">Custom</option>
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
        {[0, 1].map((teamIndex) => (
          <InputField
            key={teamIndex}
            label={`Team ${teamIndex + 1}`}
            name={`team-${teamIndex}`}
            value={formData.teams[teamIndex].name}
            placeholder={teamIndex ? "Negative" : "Affirmative"}
            onChange={(event) =>
              updateTeam(teamIndex as 0 | 1, event.target.value)
            }
            required
          />
        ))}
      </div>

      <div className="members-fields">
        {[0, 1].map((teamIndex) => (
          <div className="member-group" key={teamIndex}>
            <div className="member-heading">
              <span>Team {teamIndex + 1} members</span>
              {formData.format === "Custom" && (
                <Button
                  className="add-member-button"
                  variant="ghost"
                  type="button"
                  onClick={() => addMember(teamIndex as 0 | 1)}
                >
                  + Add member
                </Button>
              )}
            </div>
            {formData.teams[teamIndex].members.map((member, memberIndex) => (
              <div className="member-input" key={`${teamIndex}-${memberIndex}`}>
                <InputField
                  label={`Member ${memberIndex + 1}`}
                  name={`team-${teamIndex}-member-${memberIndex}`}
                  value={member.name}
                  placeholder="Member name"
                  onChange={(event) =>
                    updateMember(
                      teamIndex as 0 | 1,
                      memberIndex,
                      event.target.value,
                    )
                  }
                />
                {formData.format === "Custom" &&
                  formData.teams[teamIndex].members.length > 1 && (
                    <Button
                      className="remove-member-button"
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        removeMember(teamIndex as 0 | 1, memberIndex)
                      }
                    >
                      Remove
                    </Button>
                  )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <section className="configuration-section">
        <div className="configuration-heading">
          <h3>Voting & results</h3>
          <span>02</span>
        </div>
        <div className="settings-list">
          {Object.entries({
            allowAbstain: [
              "Allow abstain",
              "Allow voters to choose neither team.",
            ],
            preDebateVoting: [
              "Pre-debate voting",
              "Let the audience vote before the debate.",
            ],
            autoShowResults: [
              "Auto-show results",
              "Automatically display voting results.",
            ],
          }).map(([setting, [label, description]]) => (
            <label className="setting-row" key={setting}>
              <div>
                <strong>{label}</strong>
                <span>{description}</span>
              </div>
              <input
                type="checkbox"
                checked={
                  formData.settings[setting as keyof FormData["settings"]]
                }
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      [setting]: event.target.checked,
                    },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="configuration-section">
        <div className="configuration-heading">
          <div>
            <h3>Debate phases</h3>
            <p>Configure the order and timing of each phase.</p>
          </div>
          <span>03</span>
        </div>
        <div className="phases-list">
          {formData.phases.map((phase, index) => (
            <div className="phase-card" key={`${phase.order}-${index}`}>
              <div className="phase-number">{index + 1}</div>
              <div className="phase-fields">
                <InputField
                  label="Phase name"
                  name={`phase-name-${index}`}
                  value={phase.name}
                  placeholder="e.g. Opening"
                  onChange={(event) =>
                    updatePhase(index, "name", event.target.value)
                  }
                  required
                />
                <div className="form-row">
                  <label className="select-field">
                    Duration (minutes)
                    <input
                      type="number"
                      min="1"
                      value={phase.duration}
                      onChange={(event) =>
                        updatePhase(
                          index,
                          "duration",
                          Number(event.target.value),
                        )
                      }
                      required
                    />
                  </label>
                  <label className="select-field">
                    Timing
                    <select
                      value={phase.timingMode}
                      onChange={(event) =>
                        updatePhase(
                          index,
                          "timingMode",
                          event.target.value as Phase["timingMode"],
                        )
                      }
                    >
                      <option value="per-team">Per team</option>
                      <option value="team-one">Team 1 only</option>
                      <option value="team-two">Team 2 only</option>
                      <option value="shared">Shared</option>
                    </select>
                  </label>
                </div>
                {formData.phases.length > 1 && (
                  <Button
                    className="remove-phase-button"
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        format: "Custom",
                        phases: current.phases.filter(
                          (_, phaseIndex) => phaseIndex !== index,
                        ),
                      }))
                    }
                  >
                    Remove phase
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button
          className="add-phase-button"
          variant="ghost"
          type="button"
          onClick={() =>
            setFormData((current) => ({
              ...current,
              format: "Custom",
              phases: [
                ...current.phases,
                {
                  name: "",
                  duration: 1,
                  timingMode: "per-team",
                  order: current.phases.length + 1,
                },
              ],
            }))
          }
        >
          + Add phase
        </Button>
      </section>

      <Button className="create-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}

export default SessionForm;
