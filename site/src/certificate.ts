import { getCertIssuedDate, getCertName, getOrCreateCertId, setCertName } from "./storage";

const WIDTH = 900;
const HEIGHT = 620;
const SITE_URL = "https://usr-wwelsh.github.io/go-course/";
const COURSE_NAME = "Go, by Doing";
const INK = "#1a1a1a";
const MUTED = "#6b6b66";
const FAINT = "#9a9a94";
const RULE = "#cbcbc2";
const PAPER = "#fbfbf8";
const ACCENT = "#3f6b4e";

// Certificate URLs carry the cert data itself, base64url-encoded — there's no
// backend to look it up against. This is encoding, not encryption: the
// "key" would have to ship in this same JS bundle, so it can't keep the
// contents secret or stop someone from handcrafting a token. It's enough to
// give each learner a stable, shareable link to their own certificate.
export interface CertToken {
  n: string;
  d: string;
  i: string;
}

function encodeCertToken(name: string, date: string, id: string): string {
  const json = JSON.stringify({ n: name, d: date, i: id });
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCertToken(token: string): CertToken | null {
  try {
    const bin = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed.n === "string" && typeof parsed.d === "string" && typeof parsed.i === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// SVG-in-SVG via a data URI <image> is unreliable to rasterize (nested vector
// documents, font substitution across the two documents' contexts). Loading
// each mark as a plain same-origin image and re-drawing it onto a canvas
// flattens it to a PNG once, up front — the same reliable path the browser
// already uses to show these files as the page's own favicon.
async function rasterizeMark(url: string, size: number): Promise<string> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

function buildCertSvg(name: string, date: string, id: string, wUri: string, gopherUri: string): string {
  const displayName = escapeXml(name.trim() || "Your Name");
  const displayDate = escapeXml(date);
  const displayId = escapeXml(id);
  const serif = "Georgia, 'Times New Roman', serif";
  const mono = "ui-monospace, 'SF Mono', Menlo, monospace";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect x="18" y="18" width="864" height="584" fill="none" stroke="${INK}" stroke-width="2"/>
<rect x="28" y="28" width="844" height="564" fill="none" stroke="${ACCENT}" stroke-opacity="0.45" stroke-width="1"/>

<line x1="200" y1="90" x2="290" y2="90" stroke="${RULE}" stroke-width="1"/>
<line x1="610" y1="90" x2="700" y2="90" stroke="${RULE}" stroke-width="1"/>
<text x="450" y="94" text-anchor="middle" font-family="${serif}" font-size="12" letter-spacing="3" fill="${FAINT}">CERTIFICATE OF COMPLETION</text>

<text x="450" y="152" text-anchor="middle" font-family="${serif}" font-size="42" font-weight="700" fill="${INK}">${COURSE_NAME}</text>
<text x="450" y="178" text-anchor="middle" font-family="${serif}" font-style="italic" font-size="13" fill="${MUTED}">A free, browser-based Go course</text>
<line x1="420" y1="196" x2="480" y2="196" stroke="${ACCENT}" stroke-width="2"/>

<text x="450" y="238" text-anchor="middle" font-family="${serif}" font-size="15" fill="${MUTED}">This certifies that</text>
<text x="450" y="298" text-anchor="middle" font-family="${serif}" font-style="italic" font-size="34" fill="${INK}">${displayName}</text>
<line x1="280" y1="316" x2="620" y2="316" stroke="${RULE}" stroke-width="1"/>
<text x="450" y="352" text-anchor="middle" font-family="${serif}" font-size="15" fill="${MUTED}">has completed all ten chapters of the course</text>
<text x="450" y="374" text-anchor="middle" font-family="${serif}" font-style="italic" font-size="12" fill="${FAINT}">Read a little. Wrote a little. Every test passed.</text>
<text x="450" y="414" text-anchor="middle" font-family="${serif}" font-size="12" fill="${FAINT}">Issued ${displayDate}</text>

<circle cx="90" cy="524" r="36" fill="${PAPER}" stroke="${ACCENT}" stroke-width="2"/>
<circle cx="90" cy="524" r="30" fill="none" stroke="${RULE}" stroke-width="1"/>
<image href="${wUri}" x="65" y="499" width="50" height="50"/>

<circle cx="810" cy="524" r="36" fill="${PAPER}" stroke="${ACCENT}" stroke-width="2"/>
<circle cx="810" cy="524" r="30" fill="none" stroke="${RULE}" stroke-width="1"/>
<image href="${gopherUri}" x="784" y="498" width="52" height="52"/>

<text x="450" y="578" text-anchor="middle" font-family="${mono}" font-size="11" letter-spacing="0.5" fill="${FAINT}">CERTIFICATE ID  ${displayId}</text>
</svg>`;
}

async function downloadPng(svgMarkup: string, filename: string): Promise<void> {
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) return;
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// LinkedIn retired prefill on this endpoint (it now just opens the manual
// "add a certification" form) but keeps accepting these params for older
// integrations, so there's no downside to still sending them.
function linkedInUrl(name: string, date: string, id: string): string {
  const issued = new Date(`${date}T00:00:00Z`);
  const expires = new Date(issued);
  expires.setUTCFullYear(expires.getUTCFullYear() + 3);

  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: COURSE_NAME,
    organizationName: "wwel.sh",
    issueYear: String(issued.getUTCFullYear()),
    issueMonth: String(issued.getUTCMonth() + 1),
    expirationYear: String(expires.getUTCFullYear()),
    expirationMonth: String(expires.getUTCMonth() + 1),
    certUrl: `${SITE_URL}?v=${encodeCertToken(name, date, id)}`,
    certId: id,
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

export function mountCertificate(container: HTMLElement, allComplete: boolean): void {
  if (!allComplete) {
    container.innerHTML = `<p>Your certificate unlocks once every chapter is complete — keep going.</p>`;
    return;
  }

  const id = getOrCreateCertId();
  const date = getCertIssuedDate();
  let name = getCertName();

  container.innerHTML = `
    <div class="cert-controls">
      <label for="cert-name">Name on certificate</label>
      <input id="cert-name" type="text" maxlength="80" autocomplete="name" placeholder="Your Name" value="${escapeXml(name)}">
    </div>
    <div class="cert-preview" id="cert-preview" aria-live="polite"></div>
    <div class="cert-actions">
      <button id="cert-download" type="button" disabled>Download certificate</button>
      <a id="cert-linkedin" class="cert-linkedin" href="#" target="_blank" rel="noopener noreferrer" aria-disabled="true">Add to LinkedIn</a>
    </div>
    <p class="cert-note">LinkedIn's "Add to Profile" form no longer accepts prefilled skills or a media image — download the certificate above and attach it there by hand.</p>
  `;

  const nameInput = container.querySelector<HTMLInputElement>("#cert-name")!;
  const preview = container.querySelector<HTMLElement>("#cert-preview")!;
  const downloadBtn = container.querySelector<HTMLButtonElement>("#cert-download")!;
  const linkedinLink = container.querySelector<HTMLAnchorElement>("#cert-linkedin")!;

  let svgMarkup = "";

  const render = () => {
    const hasName = name.trim().length > 0;
    downloadBtn.disabled = !hasName;
    linkedinLink.setAttribute("aria-disabled", String(!hasName));
    linkedinLink.href = hasName ? linkedInUrl(name, date, id) : "#";
  };

  Promise.all([rasterizeMark("wW-mark.svg", 160), rasterizeMark("gopher-mark.svg", 160)]).then(
    ([wUri, gopherUri]) => {
      const update = () => {
        svgMarkup = buildCertSvg(name, date, id, wUri, gopherUri);
        preview.innerHTML = svgMarkup;
        render();
      };
      update();

      nameInput.addEventListener("input", () => {
        name = nameInput.value;
        setCertName(name);
        update();
      });
    },
  );

  downloadBtn.addEventListener("click", () => {
    if (!svgMarkup) return;
    void downloadPng(svgMarkup, "go-by-doing-certificate.png");
  });

  linkedinLink.addEventListener("click", (e) => {
    if (linkedinLink.getAttribute("aria-disabled") === "true") e.preventDefault();
  });
}

export async function mountCertificateView(container: HTMLElement, token: string): Promise<CertToken | null> {
  const data = decodeCertToken(token);
  if (!data) {
    container.innerHTML = `<p>This certificate link looks broken — check that you copied the whole URL.</p>`;
    return null;
  }

  const [wUri, gopherUri] = await Promise.all([
    rasterizeMark("wW-mark.svg", 160),
    rasterizeMark("gopher-mark.svg", 160),
  ]);

  container.innerHTML = `
    <div class="cert-preview">${buildCertSvg(data.n, data.d, data.i, wUri, gopherUri)}</div>
    <p class="cert-note"><a href="${SITE_URL}">Take Go, by Doing →</a></p>
  `;
  return data;
}
