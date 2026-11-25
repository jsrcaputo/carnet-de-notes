const ILSS_COMMENT_BANK = Object.freeze({
  oral: [
    'L’élève comprend les messages liés aux situations familières et prend progressivement part aux échanges.',
    'L’élève s’appuie sur ses repères visuels, auditifs et gestuels pour comprendre et se faire comprendre.',
    'L’élève précise de plus en plus ses idées, son vocabulaire et la structure de ses phrases.',
    'L’élève bénéficie encore de modèles de phrases et de reformulations pour participer à l’échange.'
  ],
  lecture: [
    'L’élève comprend les éléments explicites du texte et mobilise progressivement les indices utiles à sa compréhension.',
    'L’élève utilise les illustrations, le contexte et les mots connus pour construire le sens du texte.',
    'L’élève reconnaît des mots ou des structures étudiés et les réinvestit dans de nouvelles lectures.',
    'L’élève bénéficie encore d’une lecture guidée, de reformulations ou de questions ciblées.'
  ],
  ecriture: [
    'L’élève transmet ses idées dans des textes de complexité croissante selon le palier travaillé.',
    'L’élève s’appuie sur les modèles, banques de mots et outils de correction pour écrire.',
    'L’élève relie progressivement ses phrases et précise ses idées avec un vocabulaire plus varié.',
    'L’élève bénéficie encore d’un canevas et d’un soutien ciblé pour organiser et réviser son texte.'
  ]
});

// Observations cochables de la grille : paires [force, soutien à poursuivre], comme au régulier.
const ILSS_OBSERVATION_PAIRS = Object.freeze({
  oral: [
    ['Comprend les consignes de la classe', 'A besoin de gestes ou d’images pour comprendre une consigne'],
    ['Prend la parole spontanément', 'Prend peu la parole sans invitation'],
    ['Réutilise le vocabulaire appris', 'Cherche ses mots; vocabulaire encore limité'],
    ['Formule des phrases complètes', 'S’exprime surtout par mots isolés'],
    ['Demande de l’aide ou une reformulation', 'Hésite à signaler qu’il ne comprend pas']
  ],
  lecture: [
    ['Utilise les images et le contexte pour comprendre', 'S’appuie peu sur les indices du texte'],
    ['Reconnaît les mots étudiés', 'Décode encore lettre par lettre'],
    ['Repère les informations importantes', 'Repère difficilement l’information demandée'],
    ['Réagit au texte avec un exemple', 'Réagit au texte avec un soutien guidé'],
    ['Lit avec une fluidité croissante', 'Lecture encore hésitante']
  ],
  ecriture: [
    ['Utilise la banque de mots et les modèles', 'Utilise peu les outils de référence'],
    ['Écrit des phrases complètes', 'Écrit surtout des mots isolés'],
    ['Relie ses idées entre elles', 'Juxtapose ses idées sans liens'],
    ['Révise son texte avec un outil', 'Révise peu son texte'],
    ['Orthographie correctement les mots courants', 'Orthographie phonétique fréquente']
  ]
});
