const languageNames = {
  fr: "Français",
  en: "English",
  bas: "Basaa",
  bum: "Bulu",
  dua: "Duala",
  ewo: "Ewondo",
  fub: "Fulfulde (Adamaoua)",
  bbj: "Ghomala",
  wes: "Pidgin camerounais",
  ybb: "Yemba",
  lns: "Lamnso",
};

function addLanguages(select, codes) {
  for (const code of codes) select.add(new Option(languageNames[code], code));
}
