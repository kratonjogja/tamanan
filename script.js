const username = "kratonjogja";
const repo = "tamanan";
const branch = "gh-pages";

document.getElementById("year").textContent = new Date().getFullYear();

/* ----------------------------------------------------------
   Helper functions
---------------------------------------------------------- */

// File icons by extension
function getFileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  const icons = {
    pdf: "📄",
    mp3: "🎧",
    wav: "🔊",
    zip: "🗜️",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    txt: "📜",
    doc: "📝",
    docx: "📝",
    default: "📁",
  };
  return icons[ext] || icons.default;
}

// Numeric sort (descending)
function sortByNumericDesc(items) {
  return items.sort((a, b) => Number(b.name) - Number(a.name));
}

// Fetch JSON with simple error handling
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

/* ----------------------------------------------------------
   Load README as About section
---------------------------------------------------------- */
fetch(`https://raw.githubusercontent.com/${username}/${repo}/${branch}/README.md`)
  .then(res => res.text())
  .then(text => {
    document.getElementById("about-content").innerHTML = marked.parse(text);
  })
  .catch(() => {
    document.getElementById("about-content").textContent = "Unable to load content.";
  });

/* ----------------------------------------------------------
   Load top-level directories (years)
---------------------------------------------------------- */
fetchJSON(`https://api.github.com/repos/${username}/${repo}/contents/`)
  .then(items => {
    const years = sortByNumericDesc(items.filter(item => /^\d{4}$/.test(item.name)));
    renderYears(years);
  })
  .catch(() => {
    document.getElementById("archive-list").textContent = "Failed to load archive list.";
  });

/* ----------------------------------------------------------
   Render years accordion
---------------------------------------------------------- */
function renderYears(years) {
  const container = document.getElementById("archive-list");
  container.innerHTML = "";

  years.forEach(year => {
    const item = document.createElement("div");
    item.className = "accordion-item";

    const headerId = `heading-${year.name}`;
    const bodyId = `body-${year.name}`;

    item.innerHTML = `
      <h2 class="accordion-header" id="${headerId}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
          data-bs-target="#${bodyId}" aria-expanded="false" aria-controls="${bodyId}">
          ${year.name}
        </button>
      </h2>
      <div id="${bodyId}" class="accordion-collapse collapse" aria-labelledby="${headerId}">
        <div class="accordion-body" id="months-${year.name}">
          <div class="text-muted">Loading...</div>
        </div>
      </div>
    `;

    container.appendChild(item);

    // Lazy-load months when expanded
    item.querySelector("button").addEventListener("click", () => {
      const body = document.getElementById(`months-${year.name}`);
      if (!body.dataset.loaded) {
        loadMonths(year.name, body);
        body.dataset.loaded = "true";
      }
    });
  });
}

/* ----------------------------------------------------------
   Load months for a given year
---------------------------------------------------------- */
async function loadMonths(year, container) {
  try {
    const months = await fetchJSON(`https://api.github.com/repos/${username}/${repo}/contents/${year}`);
    container.innerHTML = "";

    const validMonths = sortByNumericDesc(months.filter(m => /^\d{2}$/.test(m.name)));

    if (!validMonths.length) {
      container.innerHTML = `<div class="text-muted">No months found.</div>`;
      return;
    }

    for (const month of validMonths) {
      await renderMonthCard(year, month, container);
    }
  } catch {
    container.innerHTML = `<div class="text-danger">Failed to load months for ${year}</div>`;
  }
}

/* ----------------------------------------------------------
   Render a month card with commit message and files
---------------------------------------------------------- */
async function renderMonthCard(year, month, container) {
  const card = document.createElement("div");
  card.className = "card mb-3";
  const cardBody = document.createElement("div");
  cardBody.className = "card-body";
  container.appendChild(card);
  card.appendChild(cardBody);

  const commitUrl = `https://api.github.com/repos/${username}/${repo}/commits?path=${year}/${month.name}&per_page=1`;

  try {
    const commits = await fetchJSON(commitUrl);
    const commitMsg = commits.length ? commits[0].commit.message.split("\n")[0] : "(no commit info)";
    cardBody.innerHTML = `
      <h4>${year}/${month.name} — <small class="text-muted">${commitMsg}</small></h4>
      <div class="file-list text-muted">Loading...</div>
    `;
  } catch {
    cardBody.innerHTML = `
      <h4>${year}/${month.name}</h4>
      <div class="file-list text-muted">Loading...</div>
    `;
  }

  loadFiles(year, month.name, cardBody.querySelector(".file-list"));
}

/* ----------------------------------------------------------
   Load files inside a given year/month
---------------------------------------------------------- */
async function loadFiles(year, month, listDiv) {
  try {
    const files = await fetchJSON(`https://api.github.com/repos/${username}/${repo}/contents/${year}/${month}`);
    if (!files.length) {
      listDiv.textContent = "No files found.";
      return;
    }

    listDiv.innerHTML = "";
    files.forEach(file => {
      const icon = getFileIcon(file.name);
      const link = document.createElement("a");
      link.href = file.download_url;
      link.target = "_blank";
      link.textContent = `${icon} ${file.name}`;
      link.className = "d-block mb-1";
      listDiv.appendChild(link);
    });
  } catch {
    listDiv.textContent = "No files found.";
  }
}
