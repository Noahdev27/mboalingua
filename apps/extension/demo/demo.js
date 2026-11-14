const scenarios = {
  morning: ["Bonjour (matin)", {}],
  afternoon: ["Bon après-midi", {}],
  evening: ["Bonsoir", {}],
  night: ["Bonne nuit", {}],
  M004: ["Vous avez reçu 7 500 FCFA de Mama Abena le 03/11/2026. Nouveau solde : 42 500 FCFA.",
    { MONTANT_1: "7 500 FCFA", NOM_1: "Mama Abena", DATE_1: "03/11/2026", MONTANT_2: "42 500 FCFA" }],
  M006: ["Confirmez l'envoi de 5 000 FCFA à Paul. Frais : 50 FCFA. Tapez 1 pour confirmer, 2 pour annuler.",
    { MONTANT_1: "5 000 FCFA", NOM_1: "Paul", MONTANT_2: "50 FCFA" }],
  M008: ["Transfert annulé. Aucun montant n'a été débité.", {}],
  M053: ["Bonjour, comment puis-je vous aider ?", {}],
  M012: ["Attention arnaque : personne ne vous demandera votre code par message ou par appel.", {}],
  M023: ["Échéance de 25 000 FCFA à payer avant le 15/11/2026. Après cette date, une pénalité de 2 500 FCFA sera appliquée.",
    { MONTANT_1: "25 000 FCFA", DATE_1: "15/11/2026", MONTANT_2: "2 500 FCFA" }],
};
const feed = document.querySelector("#feed");
for (const button of document.querySelectorAll("[data-scenario]")) {
  button.onclick = () => {
    const key = button.dataset.scenario;
    const [text, variables] = scenarios[key];
    const card = document.createElement("article");
    card.dataset.mboaTemplate = key;
    card.dataset.mboaVars = JSON.stringify(variables);
    card.textContent = text;
    feed.prepend(card);
  };
}
document.querySelector('[data-scenario="M012"]').click();
