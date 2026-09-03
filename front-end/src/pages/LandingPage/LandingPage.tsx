import "./auth.css";
import PageCard from "../../components/PageCard/PageCard";
import InputField from "../../components/InputField/Input";
import Button from "../../components/Button/Button";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <PageCard className="landing-card">
      <p className="eyebrow">Welcome to</p>
      <h1>Debate Room</h1>
      <p className="intro">
        Structured debates. Clear arguments. Better discussions.
      </p>

      <div className="action-grid">
        <section className="action-card host-card">
          <h2>Host a debate</h2>

          <Link to="/auth">Become a host</Link>
        </section>

        <section className="action-card join-card">
          <h2>Join a debate</h2>

          <div className="join-controls">
            <InputField
              label="Session code"
              name="session-code"
              placeholder="e.g. DEB-204"
            />
            <Button type="button">Join</Button>
          </div>
        </section>
      </div>
    </PageCard>
  );
}

export default LandingPage;
