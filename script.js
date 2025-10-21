const username = "kratonjogja";
const repo = "tamanan";            
const branch = "gh-pages";                 

document.getElementById("year").textContent = new Date().getFullYear();

// --- Helper: file icons based on extension ---
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

// --- Load README as About section ---
fetch(`https://raw.githubusercontent.com/${username}/${repo}/${branch}/README.md`)
  .then(res => res.text())
  .then(text => {
    document.getElementById("about-content").innerHTML = marked.parse(text);
  })
  .catch(() => {
    document.getElementById("about-content").textContent = "Unable to load content.";
  });

// --- Load top-level directories (years) ---
fetch(`https://api.github.com/repos/${username}/${repo}/contents/`)
  .then(res => res.json())
  .then(items => {
    const years = items
      .filter(item => /^\d{4}$/.test(item.name))
      .sort((a, b) => b.name.localeCompare(a.name));
    renderYears(years);
  });

function renderYears(years) {
  const container = document.getElementById("archive-list");
  years.forEach((year, i) => {
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

    // Add expand listener
    item.querySelector("button").addEventListener("click", () => {
      const body = document.getElementById(`months-${year.name}`);
      if (!body.dataset.loaded) {
        loadMonths(year.name, body);
        body.dataset.loaded = "true";
      }
    });
  });
}

function loadMonths(year, container) {
  fetch(`https://api.github.com/repos/${username}/${repo}/contents/${year}`)
    .then(res => res.json())
    .then(months => {
      container.innerHTML = "";
      months
        .filter(m => /^\d{2}$/.test(m.name))
        .sort((a, b) => b.name.localeCompare(a.name))
        .forEach(month => {
          const card = document.createElement("div");
          card.className = "card mb-3";

          const cardBody = document.createElement("div");
          cardBody.className = "card-body";

          // Get commit message for this month
          fetch(`https://api.github.com/repos/${username}/${repo}/commits?path=${year}/${month.name}&per_page=1`)
            .then(r => r.json())
            .then(commits => {
              const commitMsg = commits.length ? commits[0].commit.message.split("\n")[0] : "(no commit info)";
              cardBody.innerHTML = `<h4>${year}/${month.name} — <small class="text-muted">${commitMsg}</small></h4>
                                    <div class="file-list">Loading...</div>`;
              card.appendChild(cardBody);
              container.appendChild(card);
              loadFiles(year, month.name, cardBody.querySelector(".file-list"));
            })
            .catch(() => {
              cardBody.innerHTML = `<h4>${year}/${month.name}</h4><div class="file-list">Loading...</div>`;
              card.appendChild(cardBody);
              container.appendChild(card);
              loadFiles(year, month.name, cardBody.querySelector(".file-list"));
            });
        });
    });
}

function loadFiles(year, month, listDiv) {
  fetch(`https://api.github.com/repos/${username}/${repo}/contents/${year}/${month}`)
    .then(res => res.json())
    .then(files => {
      listDiv.innerHTML = "";
      files.forEach(file => {
        const icon = getFileIcon(file.name);
        const link = document.createElement("a");
        link.href = file.download_url;
        link.target = "_blank";
        link.textContent = `${icon} ${file.name}`;
        listDiv.appendChild(link);
      });
    })
    .catch(() => {
      listDiv.textContent = "No files found.";
    });
}
