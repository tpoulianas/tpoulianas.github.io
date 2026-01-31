(function () {
  const cfg = window.PORTFOLIO_CONFIG || { githubUsername: "tpoulianas", formspreeEndpoint: "" };

  const elProjects = document.getElementById("projects");
  const elSearch = document.getElementById("search");
  const elSort = document.getElementById("sort");
  const elYear = document.getElementById("year");
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  elYear.textContent = new Date().getFullYear();

  let repos = [];
  let filtered = [];

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function repoCard(r) {
    const name = escapeHtml(r.name);
    const desc = escapeHtml(r.description || "No description provided.");
    const lang = r.language ? escapeHtml(r.language) : "—";
    const stars = typeof r.stargazers_count === "number" ? r.stargazers_count : 0;
    const updated = r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "";
    const homepage = r.homepage ? escapeHtml(r.homepage) : "";

    const liveBtn = homepage
      ? `<a class="btn btn--ghost" href="${homepage}" target="_blank" rel="noreferrer">Live</a>`
      : "";

    return `
      <article class="project">
        <div class="project__top">
          <div class="project__name">${name}</div>
          <span class="badge">${lang}</span>
        </div>
        <p class="project__desc">${desc}</p>
        <div class="project__meta">
          <span class="badge">★ ${stars}</span>
          <span class="badge">Updated: ${updated}</span>
        </div>
        <div class="project__links">
          <a class="btn" href="${r.html_url}" target="_blank" rel="noreferrer">View on GitHub</a>
          ${liveBtn}
        </div>
      </article>
    `;
  }

  function render(list) {
    if (!elProjects) return;
    if (!list.length) {
      elProjects.innerHTML = `<p class="muted">No projects found.</p>`;
      return;
    }
    elProjects.innerHTML = list.map(repoCard).join("");
  }

  function applyFilterAndSort() {
    const q = (elSearch?.value || "").trim().toLowerCase();
    filtered = repos.filter(r => {
      if (r.fork) return false;
      if (r.archived) return false;
      const hay = `${r.name} ${(r.description||"")} ${(r.language||"")}`.toLowerCase();
      return hay.includes(q);
    });

    const mode = elSort?.value || "updated";
    filtered.sort((a,b) => {
      if (mode === "stars") return (b.stargazers_count||0) - (a.stargazers_count||0);
      if (mode === "name") return (a.name||"").localeCompare(b.name||"");
      return new Date(b.updated_at||0) - new Date(a.updated_at||0);
    });

    render(filtered);
  }

  async function loadRepos() {
    const url = `https://api.github.com/users/${encodeURIComponent(cfg.githubUsername)}/repos?per_page=100&sort=updated`;
    try {
      const res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" } });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      repos = await res.json();
      applyFilterAndSort();
    } catch (e) {
      elProjects.innerHTML = `<p class="muted">Could not load projects from GitHub. (${escapeHtml(e.message)})</p>`;
    }
  }

  elSearch?.addEventListener("input", applyFilterAndSort);
  elSort?.addEventListener("change", applyFilterAndSort);

  form?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!cfg.formspreeEndpoint) {
      status.textContent = "Form not configured yet. Add your Formspree endpoint in assets/js/config.js.";
      return;
    }
    status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch(cfg.formspreeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to send message.");
      form.reset();
      status.textContent = "Message sent. Thank you!";
    } catch (e) {
      status.textContent = "Could not send message. Please try again later.";
    }
  });

  loadRepos();
})();
