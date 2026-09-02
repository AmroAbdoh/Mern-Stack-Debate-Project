import "./auth.css";

function LandingPage() {
  return (
    <main>
      <p className="eyebrow">Welcome to</p>
      <h1>Debate Room</h1>
      <p className="intro">
        Structured debates. Clear arguments. Better discussions.
      </p>

      <div className="action-grid">
        <section className="action-card host-card">
          <h2>Host a debate</h2>
          
          <a href="#host">Become a host</a>
        </section>

        <section className="action-card join-card">
          <h2>Join a debate</h2>          

          <div className="join-controls">
            <input
              id="session-code"
              type="text"
              placeholder="e.g. DEB-204"
              autoComplete="off"
            />
            <button type="button">Join</button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LandingPage;
