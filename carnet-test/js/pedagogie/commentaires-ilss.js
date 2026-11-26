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

const ILSS_COMMENT_BANK_STRUCTURED = Object.freeze({
  oral: [
    {
      id: 'forces',
      label: 'Forces et acquis',
      phrases: [
        'L’élève comprend les messages liés aux situations familières et prend progressivement part aux échanges.',
        'Il s’appuie sur ses repères visuels, auditifs et gestuels pour comprendre et se faire comprendre.',
        'L’élève précise de plus en plus ses idées, son vocabulaire et la structure de ses phrases.',
        'Il réutilise spontanément les mots et expressions travaillés en classe.'
      ]
    },
    {
      id: 'defis',
      label: 'Défis à soutenir',
      phrases: [
        'Il bénéficie encore de modèles de phrases et de reformulations pour participer pleinement à l’échange.',
        'L’élève gagne à prendre la parole avec plus d’assurance dans les interactions spontanées.',
        'Il poursuit l’enrichissement de son vocabulaire pour formuler des messages plus complets.'
      ]
    },
    {
      id: 'strategies',
      label: 'Stratégies et soutien',
      phrases: [
        'Il utilise les gestes, les illustrations et les demandes de clarification pour soutenir sa compréhension.',
        'L’écoute active et la reprise de modèles l’aident à structurer ses interventions.'
      ]
    },
    {
      id: 'bilan',
      label: 'Bilan et progression',
      phrases: [
        'Les progrès observés à l’oral sont encourageants et soutiennent son intégration en classe.',
        'Il développe graduellement son autonomie pour communiquer dans des situations scolaires variées.'
      ]
    }
  ],
  lecture: [
    {
      id: 'forces',
      label: 'Forces et acquis',
      phrases: [
        'L’élève comprend les éléments explicites du texte et mobilise progressivement les indices utiles à sa compréhension.',
        'Il utilise les illustrations, le contexte et les mots connus pour construire le sens du texte.',
        'L’élève reconnaît des mots ou des structures étudiés et les réinvestit dans de nouvelles lectures.',
        'Il dégage les informations importantes et réagit aux textes avec pertinence.'
      ]
    },
    {
      id: 'defis',
      label: 'Défis à soutenir',
      phrases: [
        'Il bénéficie encore d’une lecture guidée, de reformulations ou de questions ciblées.',
        'L’élève gagne à consolider le décodage et la fluidité pour accéder plus aisément au sens.',
        'Il poursuit le développement de sa compréhension sur des textes un peu moins familiers.'
      ]
    },
    {
      id: 'strategies',
      label: 'Stratégies et soutien',
      phrases: [
        'Il recourt efficacement aux repères visuels, à la relecture et aux mots clés pour se dépanner.',
        'L’appui sur le contexte et les échanges préalables facilite son entrée dans le texte.'
      ]
    },
    {
      id: 'bilan',
      label: 'Bilan et progression',
      phrases: [
        'Les progrès en lecture sont encourageants; il faut poursuivre les lectures variées et accompagnées.',
        'L’élève gagne en confiance devant des textes de complexité croissante.'
      ]
    }
  ],
  ecriture: [
    {
      id: 'forces',
      label: 'Forces et acquis',
      phrases: [
        'L’élève transmet ses idées dans des textes adaptés au palier travaillé.',
        'Il relie progressivement ses phrases et précise ses idées avec un vocabulaire plus varié.',
        'L’élève réinvestit les mots appris et respecte de mieux en mieux les conventions de base.'
      ]
    },
    {
      id: 'defis',
      label: 'Défis à soutenir',
      phrases: [
        'Il bénéficie encore d’un canevas et d’un soutien ciblé pour organiser et réviser son texte.',
        'L’élève gagne à relire ses phrases à voix basse pour vérifier le sens et les accords simples.',
        'Il poursuit la structuration de phrases complètes et liées entre elles.'
      ]
    },
    {
      id: 'strategies',
      label: 'Stratégies et soutien',
      phrases: [
        'Il s’appuie utilement sur les modèles, les banques de mots et les outils de correction de la classe.',
        'La planification en quelques mots clés l’aide à organiser ses idées avant d’écrire.'
      ]
    },
    {
      id: 'bilan',
      label: 'Bilan et progression',
      phrases: [
        'Ses progrès à l’écrit sont constants et témoignent d’un bel engagement.',
        'En continuant d’utiliser ses outils de référence, il consolidera son autonomie en écriture.'
      ]
    }
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
