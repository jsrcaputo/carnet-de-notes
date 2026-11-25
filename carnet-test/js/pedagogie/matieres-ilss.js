const ILSS_PROGRAM_URL = 'https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/programme-formation-ecole-quebecoise/primaire/integration-linguistique-scolaire-sociale';
const ILSS_PALIERS_URL = 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/PFEQ-paliers-evaluation-integration-scolaire-linguistique-primaire.pdf';

const ILSS_PALIERS = Object.freeze({
  oral: [
    'Situations simples et prévisibles, sujets familiers : comprend et produit de courts messages explicites en s’appuyant sur des indices verbaux et non verbaux.',
    'Situations familières, messages généralement simples : prend part à des échanges planifiés ou spontanés avec un vocabulaire et des formulations de plus en plus précises.',
    'Sujets familiers parfois nouveaux : comprend l’essentiel, exprime ses idées avec plus de précision et réagit aux propos entendus.',
    'Situations relativement complexes, sujets plus ou moins familiers : messages comportant des informations explicites, parfois implicites, et idées expliquées sommairement.',
    'Situations complexes et diversifiées : comprend et produit des messages explicites et implicites, présente ses idées et développe certaines d’entre elles.'
  ],
  lecture: [
    'Textes illustrés, familiers et prévisibles, constitués de mots ou de phrases simples liés à l’environnement immédiat.',
    'Textes courants ou littéraires, généralement prévisibles, constitués de quelques phrases simples et d’un vocabulaire de base.',
    'Textes généralement familiers, constitués de quelques paragraphes comportant des phrases simples et un vocabulaire courant.',
    'Textes plus ou moins familiers, constitués de plusieurs paragraphes comportant des phrases complexes et un vocabulaire propre aux disciplines.',
    'Textes dont le sujet est peu ou pas familier, constitués de plusieurs paragraphes avec des phrases variées et un vocabulaire étendu.'
  ],
  ecriture: [
    'Transmet des informations simples et concrètes dans de courts textes de mots ou de phrases simples sur des sujets familiers.',
    'Transmet des informations et des idées simples dans de courts textes de phrases juxtaposées sur des sujets familiers.',
    'Rédige de courts paragraphes sur des sujets familiers; organise des informations et des idées avec des phrases généralement simples.',
    'Décrit des événements et développe brièvement certaines idées dans des textes variables de phrases souvent liées entre elles.',
    'Précise ses idées et ses informations dans des textes de longueur variable, constitués de phrases reliées sur des sujets plus ou moins familiers.'
  ]
});

const ILSS_COTES = Object.freeze([
  ['A', 'L’élève dépasse les exigences liées aux tâches du palier.'],
  ['B', 'L’élève satisfait clairement aux exigences liées aux tâches du palier.'],
  ['C', 'L’élève satisfait minimalement aux exigences liées aux tâches du palier.'],
  ['D', 'L’élève est en deçà des exigences liées aux tâches du palier.']
]);

const ILSS_OBSERVABLE_GRIDS = Object.freeze({
  oral: [
    { id: 'ilss_oral_comprehension', label: 'Compréhension des messages et des consignes', manifestations: [
      'Comprend une consigne simple et prévisible avec des indices concrets.',
      'Dégage les informations principales d’un court échange familier.',
      'Comprend des messages généralement simples, même sur un sujet moins familier.',
      'Dégage des informations explicites et certaines idées implicites dans un échange plus complexe.',
      'Comprend des échanges complexes et diversifiés et en explique le sens global.'
    ] },
    { id: 'ilss_oral_interaction', label: 'Participation aux échanges', manifestations: [
      'Réagit par des mots, des gestes et quelques informations simples.',
      'Participe à une interaction familière, avec soutien ponctuel.',
      'Prend la parole et réagit de façon de plus en plus autonome.',
      'Présente ses idées et tient compte de l’intention de communication.',
      'Interagit dans des situations variées et développe certaines de ses idées.'
    ] },
    { id: 'ilss_oral_formulation', label: 'Clarté, vocabulaire et formulation', manifestations: [
      'Se fait comprendre avec un répertoire lexical limité et des formulations simples.',
      'Produit des messages simples avec un vocabulaire de base de plus en plus disponible.',
      'Formule des phrases plus précises sur des sujets familiers et parfois nouveaux.',
      'Emploie un vocabulaire plus riche et explique sommairement ses idées.',
      'Varie ses formulations et précise son message dans des situations complexes.'
    ] },
    { id: 'ilss_oral_strategies', label: 'Stratégies et intégration culturelle', manifestations: [
      'Utilise gestes, illustrations et demandes de reformulation pour soutenir l’échange.',
      'Pratique l’écoute et reprend un modèle de phrase ou un mot clé.',
      'Demande une clarification et adapte graduellement son message.',
      'Choisit des stratégies de compréhension et de production adaptées au contexte.',
      'Ajuste ses stratégies et tient compte des conventions propres au milieu scolaire.'
    ] }
  ],
  lecture: [
    { id: 'ilss_lecture_sens', label: 'Construction du sens', manifestations: [
      'Associe mots, illustrations et informations simples dans un texte prévisible.',
      'Comprend l’idée générale de phrases simples sur un sujet familier.',
      'Relève les informations importantes de quelques paragraphes.',
      'Construit le sens de plusieurs paragraphes et fait des liens entre les informations.',
      'Comprend des textes variés dont le sujet peut être peu familier.'
    ] },
    { id: 'ilss_lecture_elements', label: 'Repérage des éléments du texte', manifestations: [
      'Repère quelques mots appris et les éléments visuels utiles.',
      'Relève des éléments explicites dans un texte court.',
      'Repère les personnages, événements et informations principales.',
      'Distingue informations explicites, indices et relations entre les idées.',
      'Dégage des éléments explicites et implicites dans des textes complexes.'
    ] },
    { id: 'ilss_lecture_reaction', label: 'Interprétation, réaction et vocabulaire', manifestations: [
      'Réagit de façon simple au texte avec un support ou des questions.',
      'Exprime une réaction et s’appuie sur un élément familier du texte.',
      'Justifie brièvement sa compréhension ou sa réaction.',
      'Appuie son interprétation sur des indices précis et un vocabulaire plus varié.',
      'Interprète et apprécie le texte avec des justifications nuancées.'
    ] },
    { id: 'ilss_lecture_strategies', label: 'Stratégies de lecture', manifestations: [
      'Utilise les images, les mots connus et un modèle adulte.',
      'Relit, pointe les mots et recherche un indice connu.',
      'Choisit une stratégie de décodage ou de compréhension parmi celles enseignées.',
      'Combine contexte, structure et ressources pour résoudre une difficulté.',
      'Choisit, ajuste et explique ses stratégies dans des textes variés.'
    ] }
  ],
  ecriture: [
    { id: 'ilss_ecriture_idees', label: 'Idées et adaptation à la situation', manifestations: [
      'Transmet une information simple avec quelques mots ou une phrase.',
      'Produit de courtes phrases liées à un sujet familier.',
      'Présente des informations et des idées dans un court paragraphe.',
      'Développe brièvement ses idées dans un texte de longueur variable.',
      'Adapte son texte, précise ses idées et tient compte du destinataire.'
    ] },
    { id: 'ilss_ecriture_coherence', label: 'Organisation et cohérence', manifestations: [
      'Ordonne quelques mots ou phrases avec soutien.',
      'Écrit des phrases juxtaposées qui restent liées au sujet.',
      'Relie parfois les phrases pour organiser ses idées.',
      'Relie généralement les idées et organise un texte plus long.',
      'Fait progresser les idées entre les phrases et les paragraphes.'
    ] },
    { id: 'ilss_ecriture_langue', label: 'Vocabulaire, syntaxe et orthographe', manifestations: [
      'Écrit des mots appris et des phrases simples encore influencées par l’oral.',
      'Construit des phrases simples avec un vocabulaire de base.',
      'Utilise un vocabulaire courant, des phrases plus stables et quelques conventions.',
      'Maîtrise mieux les structures, la ponctuation et l’orthographe des mots courants.',
      'Varie les phrases et emploie un vocabulaire plus précis ou propre aux disciplines.'
    ] },
    { id: 'ilss_ecriture_revision', label: 'Révision et recours aux ressources', manifestations: [
      'Cherche un mot avec l’aide d’une banque ou d’un modèle.',
      'Relit avec soutien et corrige quelques éléments repérés.',
      'Utilise des outils connus pour réviser une partie de son texte.',
      'Choisit des ressources et révise plusieurs aspects de son texte.',
      'Planifie, révise et justifie ses choix de façon plus autonome.'
    ] }
  ]
});

const ILSS_CYCLE_GUIDANCE = Object.freeze({
  1: '1er cycle : messages et textes courts, contexte familier, forte importance des appuis visuels et langagiers.',
  2: '2e cycle : idées et textes plus développés; un palier 3 peut constituer un repère de sortie en intégration régulière, à confirmer par le jugement professionnel.',
  3: '3e cycle : informations plus complexes, textes et interactions variés, vocabulaire disciplinaire et autonomie accrue.'
});

const ILSS_SUBJECTS = Object.freeze([
  {
    id: 'ilss_oral',
    competency: 'oral',
    partLabel: 'Communiquer oralement (C1)',
    shortName: 'ILSS (Français) • Oral (C1)',
    fullName: 'ILSS — Communiquer oralement en français dans des situations variées'
  },
  {
    id: 'ilss_lecture',
    competency: 'lecture',
    partLabel: 'Lire des textes variés (C2)',
    shortName: 'ILSS (Français) • Lecture (C2)',
    fullName: 'ILSS — Lire des textes variés en français'
  },
  {
    id: 'ilss_ecriture',
    competency: 'ecriture',
    partLabel: 'Écrire des textes variés (C3)',
    shortName: 'ILSS (Français) • Écriture (C3)',
    fullName: 'ILSS — Écrire des textes variés en français'
  }
]);

ALL_SUBJECTS_CONFIG.push(...ILSS_SUBJECTS.map(subject => ({
  ...subject,
  ilssCompetency: subject.competency,
  group: 'ilss',
  groupLabel: 'ILSS (Français)',
  isIlss: true,
  autoAccueil: true,
  hiddenFromGroupSelector: true,
  icon: 'IL',
  criteria: [],
  refUrl: ILSS_PROGRAM_URL,
  palierUrl: ILSS_PALIERS_URL
})));
