# MboaLingua — SAFINUM prototype

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge and enable Developer mode.
2. Choose **Load unpacked** and select the folder containing `manifest.json`. If that folder is already loaded, click **Reload** on the extension card.
3. Open or refresh the [SAFINUM hackathon simulator](https://safinum.cm/hackathon-test).
4. Click the floating **MboaLingua** button at the bottom right. Choose a language under **Langue du texte** and click **Appliquer**. Choose **Texte original** to restore the page.

SAFINUM uses bundled French and English references and draft lexicons for Basaa, Bulu, Duala, Ewondo, Fulfulde, Ghomala, Cameroon Pidgin and Yemba. It translates recognized labels as the simulator changes screens. The Cameroonian translations need fluent-speaker review, and coverage varies by language. Kalaba Money uses complete translations where a matching message template or phrase is bundled.

## Salutations

Choose a text language, click **Appliquer**, then open **Salutations** to see the morning, afternoon, evening and night phrases. The same greetings are available as cards in Kalaba and as standalone labels in SAFINUM. The French morning label is **Bonjour (matin)**. General **Bonjour** on SAFINUM continues to use the existing translation. The new greetings are written drafts for fluent-speaker review, especially forms adapted across regional varieties.

## Voice recordings and Kalaba Money

Open **Traduction vocale** in the floating panel and choose a voice language and phrase. The bundle includes 42 Ewondo, 45 Fulfulde and one Lamnso recording from the November 14 freestyle export. The export identifies the speaker's mother tongue and French prompt. The recorded language, dialect and wording still need fluent-speaker review. Lamnso has one recorded banking phrase and written greetings.

The player uses fixed recordings. SAFINUM prioritizes phrases that match text on the current screen. Kalaba shows an inline play button for matching messages, including the transaction values where a message has placeholders.

Run `python3 -m http.server 8000 --bind 127.0.0.1` from this directory and open `http://127.0.0.1:8000/demo/`. Try **Accueil vocal** in Ewondo for a recorded greeting or **Transfert annulé** in Basaa or Yemba for a translated message. **Alerte arnaque** has an existing synthetic clip in Ewondo, Fulfulde and Ghomala. The experimental Fulfulde and Ghomala clips use Hausa and Nsenga reference voices. The synthetic audio uses the AfriSpeech Africa TTS model under CC BY-NC 4.0.

## Data sources

- `collaborator-labels.json` combines the checked-in lexicon from SAFINUM-Financial-Translator (Basaa, Yemba, Fulfulde, Pidgin) with the Ewondo, Ghomala, Duala and Bulu entries from its `build_8_languages.py`. The imported phrases take precedence over older simulator drafts where the source label matches.
- `recorded-voices.json` maps complete French source phrases to the bundled recordings from `dist/freestyle-voice-data-2026-11-14/manifest.csv`. One clip had a blank language field and was omitted. The Lamnso recording has both tones, with playback stopping at the neutral segment boundary.

### Sources for greetings

- Basaa — [Aix-Marseille University interview and learner materials](https://aixls.hypotheses.org/files/2020/04/Entretien-avec-St%C3%A9phie-Rose-Nyot-Nyot.-Anne-Depetris.-2020.pdf).
- Bulu — [Master Any Language phrase list](https://www.masteranylanguage.com/c/r/fr/Bulu/CommonPhrases/o/ql001).
- Duala — [Duala.org](https://duala.org/learn), [Contes Douala](https://bigmoments.net/apprendre/) and [Duala greeting list](https://polyglotclub.com/wiki/Language/Duala/Vocabulary/How-to-Say-Hello-and-Greetings).
- Ewondo and Ghomala — [Ewondo dataset](https://mozilladatacollective.com/datasets/cmshzn02s00j1ml07fvxqooq9) and [Ghomala dataset](https://mozilladatacollective.com/datasets/cmshk8mia004rnv0724nwy021). The Ewondo afternoon entry uses a daytime wish.
- Fulfulde — [Northern Cameroon greeting study](https://minpaku.repo.nii.ac.jp/record/4247/files/KH_017_3_002.pdf) and [Pulaar dictionary](https://www.pulaar.fr/dictionnaire/?sujet=salutations). The night entry uses a Pulaar form as a draft for Adamawa review.
- Cameroon Pidgin — [Peace Corps course](https://yojik.eu/languages/PeaceCorps/Cameroon-pidgin/ED255041.pdf). The night entry follows the spelling pattern of the course examples.
- Yemba — [Apprendre le yemba](https://www.apprendreleyemba.com/2025/01/les-formules-de-politesse-dans-la.html).
- Lamnso — [The Nso Heritage](https://learnlamnso.wordpress.com/2015/11/25/greetings-in-lamnso/) and [The People of Nso](https://erasmodelavega.wordpress.com/2013/01/20/the-people-of-nso/). The night entry is a wish to sleep well.
