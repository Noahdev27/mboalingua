function renderDrafts(language, rows, frenchRows, findVoice, playVoice, reference) {
  const feed = document.querySelector("#feed");
  if (!feed) return undefined;

  const selector = "mboa-lingua[template], [data-mboa-template]";
  const slots = /\{([A-Z_0-9]+)\}/g;
  const labels = new WeakMap();

  function render() {
    for (const message of feed.querySelectorAll(selector)) {
      const key = message.getAttribute("template") ?? message.dataset.mboaTemplate;
      const raw = message.getAttribute("vars") ?? message.dataset.mboaVars ?? "{}";
      if (labels.get(message)?.raw === raw && labels.get(message)?.key === key) continue;
      const draft = Object.hasOwn(rows, key) ? rows[key] : null;
      let variables;
      try { variables = JSON.parse(raw); } catch { variables = null; }
      const french = frenchRows[key]?.text;
      const placeholders = (text) => [...text.matchAll(slots)].map((match) => match[1]);
      const expectedSlots = placeholders(french ?? "");
      const draftSlots = placeholders(draft?.text ?? "");
      const sameSlots = expectedSlots.sort().join() === draftSlots.sort().join();
      const hasValues = sameSlots && expectedSlots.every((name) => {
        const value = variables && Object.hasOwn(variables, name) ? variables[name] : null;
        return typeof value === "number" || (typeof value === "string" && value.length > 0 && value.length <= 120);
      });

      let panel = message.querySelector(":scope > [data-mboa-draft]");
      if (!panel) {
        panel = document.createElement("aside");
        panel.dataset.mboaDraft = "";
        panel.style.cssText = "margin:8px 0;padding:12px;border:1px solid #86b6a6;border-radius:8px;background:#edf8f4;color:#15372e";
        message.append(panel);
      }
      panel.replaceChildren();
      const label = document.createElement("strong");
      const labelDetail = draft && hasValues
        ? (reference ? "" : " · Traduction automatique à vérifier")
        : " · Traduction indisponible";
      label.textContent = languageNames[language] + labelDetail;
      panel.append(label);
      if (draft && hasValues) {
        const text = document.createElement("p");
        text.lang = language;
        text.textContent = draft.text.replace(slots, (_, name) => String(variables[name]));
        panel.append(text);
      }
      const voice = findVoice(french, variables) ?? (draft?.audio && hasValues && !expectedSlots.length
        ? { source: french, file: `audio/${language}/${key}.wav`, synthetic: true }
        : null);
      if (voice) {
        const listen = document.createElement("button");
        listen.type = "button";
        listen.textContent = voice.synthetic ? "Écouter la synthèse" : "Écouter l’enregistrement";
        listen.addEventListener("click", () => playVoice(voice));
        panel.append(listen);
      }
      labels.set(message, { raw, key });
    }
  }
  render();
  const observer = new MutationObserver((changes) => {
    // The host SDK can replace a card's contents after its asynchronous request.
    for (const change of changes) {
      if ([...change.removedNodes].some((node) => node.nodeType === 1 && node.hasAttribute("data-mboa-draft"))) {
        labels.delete(change.target);
      }
    }
    render();
  });
  observer.observe(feed, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ["template", "vars", "data-mboa-template", "data-mboa-vars"],
  });
  return () => {
    observer.disconnect();
    for (const panel of feed.querySelectorAll("[data-mboa-draft]")) panel.remove();
  };
}

function translateSafinum(rows, updatePageVoices) {
  const translated = new Map();
  const skipped = "script, style, noscript, svg, code, pre, textarea, input, option, [contenteditable], [hidden], [aria-hidden=true]";
  const observer = new MutationObserver(render);
  function stop() {
    observer.disconnect();
    for (const [node, { source, draft }] of translated) {
      if (node.isConnected && node.data === draft) node.data = source;
    }
    translated.clear();
  }

  function render() {
    observer.disconnect();
    for (const [node, entry] of translated) {
      if (!node.isConnected || node.data !== entry.draft) translated.delete(node);
    }
    const pageText = new Set();
    const root = document.querySelector("#app");
    if (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement?.closest(skipped)) continue;
        const source = translated.get(node)?.source ?? node.data;
        pageText.add(source);
        if (translated.has(node)) continue;
        const key = normalize(source);
        if (!Object.hasOwn(rows, key)) continue;
        const draft = source.replace(source.trim(), () => rows[key]);
        if (draft === source || financialTokens(source) !== financialTokens(draft)) continue;
        node.data = draft;
        translated.set(node, { source, draft });
      }
    }
    updatePageVoices(pageText);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  render();
  return stop;
}

const normalize = (value) => value.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

function financialTokens(text) {
  return JSON.stringify(text.match(/[+−-]?\d+(?:[\s.,:/-]\d+)*\s*%?|\b(?:CFAF?|FCFA|XAF|EUR|USD)\b/gi)
    ?.map((token) => normalize(token)) ?? []);
}

const safinum = location.origin === "https://safinum.cm"
  && location.pathname.replace(/\/$/, "") === "/hackathon-test";
const greetingAliases = {
  morning: ["good morning", "bon matin", "bonjour (matin)"],
  afternoon: ["good afternoon", "bon après-midi", "bonne après-midi", "bon après midi", "bonne après midi"],
  evening: ["good evening", "bonsoir", "bon soir"],
  night: ["good night", "goodnight", "bonne nuit"],
};

function greetingLabels(greetings) {
  const labels = {};
  for (const [period, aliases] of Object.entries(greetingAliases)) {
    for (const alias of aliases) {
      for (const ending of ["", "!", " !", ".", "?", " ?"]) {
        const translation = greetings[period];
        labels[alias + ending] = ending && !/[.!?]$/.test(translation) ? translation + ending : translation;
      }
    }
  }
  return labels;
}

const kalaba = ["http://localhost:8000", "http://127.0.0.1:8000"].includes(location.origin)
  && location.pathname.replace(/\/$/, "") === "/demo";
if (safinum || kalaba) mountTranslator();

function mountTranslator() {
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("floating.css");
  const ui = document.createElement("div");
  ui.className = "translator";
  ui.hidden = true;
  ui.lang = "fr";
  ui.innerHTML = `
    <section id="mboa-panel" aria-labelledby="mboa-title" hidden>
      <header><h2 id="mboa-title">MboaLingua</h2><button type="button" id="close" aria-label="Fermer">×</button></header>
      <form>
        <label for="language">Langue du texte</label>
        <select id="language"><option value="">Texte original</option></select>
        <button class="primary" type="submit">Appliquer</button>
      </form>
      <p id="status" role="status"></p>
      <details id="greetings" hidden>
        <summary>Salutations</summary>
        <dl></dl>
      </details>
      <details>
        <summary>Traduction vocale</summary>
        <label for="voice-language">Langue de la voix</label>
        <select id="voice-language"></select>
        <label for="voice-phrase">Phrase à écouter</label>
        <select id="voice-phrase"></select>
        <button id="listen" type="button">Écouter</button>
        <p id="voice-status" role="status"></p>
        <audio controls preload="none" hidden aria-label="Lecture de la voix"></audio>
      </details>
    </section>
    <button class="launcher" aria-expanded="false" aria-controls="mboa-panel" type="button">
      <span aria-hidden="true">🌐</span> MboaLingua
    </button>`;
  style.onload = style.onerror = () => { ui.hidden = false; };
  shadow.append(style, ui);
  document.documentElement.append(host);

  const panel = shadow.querySelector("section");
  const launcher = shadow.querySelector(".launcher");
  const languageSelect = shadow.querySelector("#language");
  const status = shadow.querySelector("#status");
  const details = shadow.querySelector("details:not(#greetings)");
  const voiceLanguage = shadow.querySelector("#voice-language");
  const voicePhrase = shadow.querySelector("#voice-phrase");
  const listen = shadow.querySelector("#listen");
  const voiceStatus = shadow.querySelector("#voice-status");
  const player = shadow.querySelector("audio");
  addLanguages(languageSelect, Object.keys(languageNames));
  addLanguages(voiceLanguage, ["ewo", "fub", "bbj", "lns"]);

  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    (open ? languageSelect : launcher).focus();
  }
  launcher.onclick = () => toggle(panel.hidden);
  shadow.querySelector("#close").onclick = () => toggle(false);
  ui.onkeydown = (event) => {
    if (event.key === "Escape" && !panel.hidden) toggle(false);
  };

  async function load(filename) {
    const response = await fetch(chrome.runtime.getURL(filename + ".json"));
    if (!response.ok) throw new Error("Missing language data");
    return response.json();
  }

  const data = Promise.all([
    load("collaborator-labels"),
    load("safinum-labels"),
    load("recorded-voices"),
    load("kalaba-reference"),
    load("prototype-drafts"),
    load("greetings"),
  ]).then(([labels, saf, voices, references, drafts, greetings]) => {
    return { labels: labels.languages, saf, voices, references: references.reference, drafts: drafts.languages, greetings };
  }).catch(() => {
    status.textContent = "Impossible de charger les traductions. Rechargez la page.";
    return null;
  });

  let currentLanguage = "";
  let stopTranslation;
  let pageText = new Set();
  function updatePageVoices(text) {
    if (text.size === pageText.size && [...text].every((value) => pageText.has(value))) return;
    pageText = text;
    if (details.open) updateVoiceChoices();
  }
  let voiceChoices = [];
  let neutralEnd;
  let audioRequest = 0;

  function resetPlayer() {
    audioRequest++;
    player.pause();
    player.removeAttribute("src");
    player.hidden = true;
    neutralEnd = undefined;
    voiceStatus.textContent = "";
  }

  async function playVoice(clip) {
    resetPlayer();
    const request = audioRequest;
    details.open = true;
    toggle(true);
    neutralEnd = clip.neutralEnd;
    voiceStatus.textContent = clip.synthetic
      ? "Voix de synthèse · prononciation à vérifier."
      : `Enregistrement non vérifié · ${clip.source}`;
    player.src = chrome.runtime.getURL(clip.file);
    player.preload = "metadata";
    player.hidden = false;
    try {
      await player.play();
    } catch {
      if (request === audioRequest) voiceStatus.textContent = "Lecture indisponible. Réessayez avec le lecteur.";
    }
  }

  player.ontimeupdate = () => {
    if (neutralEnd && player.currentTime >= neutralEnd) {
      player.pause();
      player.currentTime = 0;
    }
  };

  async function updateVoiceChoices() {
    const packs = await data;
    if (!packs) return;
    const code = voiceLanguage.value;
    const selected = voiceChoices[Number(voicePhrase.value)]?.file;
    const catalog = Object.values(packs.voices[code] ?? {});
    const onPage = new Set([...pageText].map(normalize));
    const matches = catalog.filter((clip) => onPage.has(normalize(clip.source)));
    voiceChoices = [...matches, ...catalog.filter((clip) => !onPage.has(normalize(clip.source)))];
    const synthetic = packs.drafts[code]?.M012;
    if (synthetic?.audio) voiceChoices.push({
      source: synthetic.fr, file: `audio/${code}/M012.wav`, synthetic: true,
    });
    voicePhrase.replaceChildren(...voiceChoices.map((clip, index) => new Option(
      (matches.includes(clip) ? "Sur cette page · " : "") + clip.source + (clip.synthetic ? " (synthèse)" : ""),
      index,
    )));
    const previous = voiceChoices.findIndex((clip) => clip.file === selected);
    if (previous >= 0) voicePhrase.value = previous;
    listen.disabled = voiceChoices.length === 0;
  }

  voiceLanguage.onchange = () => {
    resetPlayer();
    updateVoiceChoices();
  };
  voicePhrase.onchange = resetPlayer;
  listen.onclick = () => {
    const clip = voiceChoices[Number(voicePhrase.value)];
    if (clip) playVoice(clip);
  };
  listen.disabled = true;
  updateVoiceChoices();

  let latestTranslation = 0;
  async function applyLanguage(language) {
    const request = ++latestTranslation;
    const packs = await data;
    if (!packs) return { message: status.textContent };
    if (request !== latestTranslation) return { message: "Une autre langue a été sélectionnée." };
    if (language && !Object.hasOwn(languageNames, language)) {
      return { message: "Traduction écrite indisponible." };
    }
    stopTranslation?.();
    stopTranslation = undefined;
    resetPlayer();
    currentLanguage = language;
    languageSelect.value = language;
    const reference = language === "fr" || language === "en";
    if (Object.hasOwn(packs.voices, language) || packs.drafts[language]?.M012?.audio) {
      voiceLanguage.value = language;
    }
    const localized = { ...packs.saf.languages[language], ...packs.labels[language] };
    // Fill English aliases from the same French label where a reference pair exists.
    if (!reference) {
      for (const [english, french] of Object.entries(packs.saf.reference.fr)) {
        if (Object.hasOwn(localized, normalize(french))) localized[english] = localized[normalize(french)];
      }
    }
    const greetings = shadow.querySelector("#greetings");
    greetings.hidden = !language;
    const phraseList = greetings.querySelector("dl");
    phraseList.replaceChildren();
    const phrases = packs.greetings[language];
    const greetingRows = language ? greetingLabels(phrases) : {};
    if (phrases) {
      for (const [period, french] of Object.entries(packs.greetings.fr)) {
        const term = document.createElement("dt");
        term.textContent = period === "morning" ? "Bonjour (matin)" : french;
        const translation = document.createElement("dd");
        translation.lang = language;
        translation.textContent = phrases[period];
        phraseList.append(term, translation);
      }
    }
    if (safinum) {
      const rows = language ? { ...(reference ? packs.saf.reference[language] : localized), ...greetingRows } : {};
      stopTranslation = translateSafinum(rows, updatePageVoices);
    } else if (language) {
      const frenchRows = packs.references.fr;
      const rows = { ...(reference ? packs.references[language] : packs.drafts[language]) };
      for (const [period, text] of Object.entries(phrases)) rows[period] = { text };
      if (!reference) {
        for (const [key, row] of Object.entries(frenchRows)) {
          const label = localized[normalize(row.text)];
          if (label && !rows[key]) rows[key] = { text: label };
        }
      }
      const findVoice = (french, variables) => {
        if (!french) return null;
        const phrase = french.replace(/\{([A-Z_0-9]+)\}/g, (slot, key) => {
          const value = variables && Object.hasOwn(variables, key) ? variables[key] : null;
          return typeof value === "number" || typeof value === "string" ? String(value) : slot;
        });
        return packs.voices[language]?.[normalize(phrase)];
      };
      stopTranslation = renderDrafts(language, rows, frenchRows, findVoice, playVoice, reference);
    }
    updateVoiceChoices();
    status.textContent = language
      ? `${languageNames[language]}${reference ? "" : " · Traductions à vérifier"}`
      : "Texte original rétabli.";
    return { message: status.textContent };
  }

  shadow.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    applyLanguage(languageSelect.value);
  };
  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (message.action === "mboa-state") reply({ language: currentLanguage });
    if (message.action === "mboa-translate") {
      applyLanguage(message.language).then(reply, () => reply({ message: "Traduction indisponible." }));
      return true;
    }
  });
  if (safinum) {
    stopTranslation = translateSafinum({}, updatePageVoices);
  }
  details.ontoggle = () => { if (details.open) updateVoiceChoices(); };
}
