const status = document.querySelector("#status");
const apply = document.querySelector("#apply");
const language = document.querySelector("#language");
addLanguages(language, Object.keys(languageNames));

async function send(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.sendMessage(tab.id, message);
}

send({ action: "mboa-state" }).then((state) => {
  language.value = state.language;
  apply.disabled = false;
}).catch(() => {
  status.textContent = "Ouvrez le simulateur SAFINUM ou la démo Kalaba Money.";
});

document.querySelector("#translate").onsubmit = async (event) => {
  event.preventDefault();
  apply.disabled = true;
  try {
    const result = await send({ action: "mboa-translate", language: language.value });
    status.textContent = result.message;
  } catch {
    status.textContent = "Rechargez la page et réessayez.";
  } finally {
    apply.disabled = false;
  }
};
