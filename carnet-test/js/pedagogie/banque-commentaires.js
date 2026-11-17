// Adaptations rédactionnelles des observations du comité évaluation CSSDD (octobre 2023).
// Chaque paire suit l’ordre du document fourni : progrès, puis besoin de soutien.
// Le surlignage propre aux 4 ans n’étant pas disponible, les défis doivent être validés selon l’âge.
const PRESCHOOL_COMMENT_OBSERVATIONS = {
  presco_c1: [
    ['L’élève coordonne les différentes parties de son corps dans ses jeux.', 'Il apprend à coordonner les différentes parties de son corps dans ses jeux.'],
    ['L’élève réalise des actions comme ramper, courir, sauter, lancer et attraper.', 'Il bénéficie de soutien pour réaliser des actions comme ramper, courir, sauter, lancer et attraper.'],
    ['L’élève explore des matériaux variés, comme l’eau, la pâte à modeler et le sable.', 'Il bénéficie d’un accompagnement pour explorer des matériaux variés, comme l’eau, la pâte à modeler et le sable.'],
    ['L’élève précise ses gestes pour découper, coller, colorier, tracer et enfiler.', 'Il apprend à ajuster ses gestes pour découper, coller, colorier, tracer et enfiler.'],
    ['L’élève s’habille sans aide lors des routines de la journée.', 'Il bénéficie de soutien pour s’habiller lors des routines de la journée.'],
    ['L’élève réalise les gestes d’hygiène du quotidien, comme aller aux toilettes et se moucher, sans aide.', 'Il bénéficie de rappels et de soutien pour les gestes d’hygiène du quotidien, comme aller aux toilettes et se moucher.'],
    ['L’élève ajuste sa posture et ses mouvements à l’activité en cours.', 'Il apprend à ajuster sa posture et ses mouvements à l’activité en cours.'],
    ['L’élève essaie différents moyens pour se détendre et choisit ceux qui lui conviennent.', 'Il bénéficie de soutien pour essayer différents moyens de se détendre.'],
    ['L’élève reconnaît les situations qui comportent des risques et adapte ses gestes pour agir de façon sécuritaire.', 'Il bénéficie de rappels pour reconnaître les situations qui comportent des risques et adapter ses gestes.'],
    ['L’élève manie les crayons avec précision dans ses dessins et ses tracés.', 'Il apprend à manier les crayons avec précision dans ses dessins et ses tracés.'],
    ['L’élève manie les ciseaux avec précision lors des activités de découpage.', 'Il bénéficie de soutien pour manier les ciseaux lors des activités de découpage.']
  ],
  presco_c2: [
    ['L’élève choisit de quoi s’occuper pendant les temps libres et les transitions.', 'Il bénéficie de soutien pour choisir de quoi s’occuper pendant les temps libres et les transitions.'],
    ['L’élève suit les routines de la classe sans aide.', 'Il bénéficie de rappels pour suivre les routines de la classe.'],
    ['L’élève demande de l’aide à l’adulte ou à un autre enfant au besoin.', 'Il apprend à demander de l’aide à l’adulte ou à un autre enfant au besoin.'],
    ['L’élève accepte l’aide de l’adulte ou d’un autre enfant.', 'Il bénéficie d’un accompagnement pour accueillir l’aide de l’adulte ou d’un autre enfant.'],
    ['L’élève prend des initiatives et assume de petites responsabilités dans des activités variées.', 'Il bénéficie d’encouragements pour prendre des initiatives et assumer de petites responsabilités.'],
    ['L’élève poursuit ses essais lorsqu’une difficulté se présente.', 'Il bénéficie d’encouragements pour poursuivre ses essais lorsqu’une difficulté se présente.'],
    ['L’élève fait des choix en fonction de ses goûts et de ses intérêts.', 'Il bénéficie de soutien pour préciser ses goûts et faire des choix selon ses intérêts.'],
    ['L’élève fait connaître ses idées en groupe, avec un autre enfant et dans les jeux.', 'Il bénéficie d’encouragements pour faire connaître ses idées en groupe, avec un autre enfant et dans les jeux.'],
    ['L’élève exprime ses sentiments et ses émotions par des mots ou des gestes qui respectent les autres.', 'Il apprend à exprimer ses sentiments et ses émotions par des mots ou des gestes qui respectent les autres.'],
    ['L’élève utilise des moyens pour ajuster ses réactions émotives à la situation.', 'Il bénéficie du soutien de l’adulte pour reconnaître ses émotions et ajuster ses réactions à la situation.'],
    ['L’élève s’adapte aux changements et aux imprévus de la journée.', 'Il bénéficie de repères et de soutien pour s’adapter aux changements et aux imprévus.'],
    ['L’élève essaie de nouvelles façons de faire et accepte de se tromper en apprenant.', 'Il bénéficie d’encouragements pour faire des essais, même sans connaître le résultat à l’avance.'],
    ['L’élève nomme certaines de ses forces et reconnaît ce que ses capacités lui permettent de faire.', 'Il bénéficie de soutien pour reconnaître ses forces et ce que ses capacités lui permettent de faire.'],
    ['L’élève exprime son appréciation d’une activité, par exemple en disant ce qui lui a plu ou déplu.', 'Il apprend à exprimer son appréciation d’une activité en disant ce qui lui a plu ou déplu.']
  ],
  presco_c3: [
    ['L’élève entre en relation avec les adultes connus de son milieu.', 'Il bénéficie d’un accompagnement pour entrer en relation avec les adultes connus de son milieu.'],
    ['L’élève échange avec les autres enfants dans les activités de la classe.', 'Il bénéficie de soutien pour échanger avec les autres enfants dans les activités de la classe.'],
    ['L’élève pose des gestes pour créer des liens, comme saluer ou inviter un enfant à jouer.', 'Il apprend à poser des gestes pour créer des liens, comme saluer ou inviter un enfant à jouer.'],
    ['L’élève accueille les différences entre les personnes, notamment dans leurs émotions et leurs caractéristiques.', 'Il bénéficie de soutien pour accueillir les différences entre les personnes, notamment dans leurs émotions et leurs caractéristiques.'],
    ['L’élève participe à des jeux avec d’autres enfants.', 'Il bénéficie d’un accompagnement pour prendre sa place dans les jeux avec d’autres enfants.'],
    ['L’élève prend part aux activités du groupe.', 'Il bénéficie d’encouragements pour prendre part aux activités du groupe.'],
    ['L’élève assume des responsabilités à sa mesure au sein du groupe.', 'Il bénéficie de soutien pour assumer des responsabilités à sa mesure au sein du groupe.'],
    ['L’élève propose son aide aux autres.', 'Il bénéficie d’encouragements pour proposer son aide aux autres.'],
    ['L’élève partage l’espace et le matériel avec les autres enfants.', 'Il apprend à partager l’espace et le matériel avec les autres enfants.'],
    ['L’élève connaît les règles de vie de la classe et les respecte dans les situations du quotidien.', 'Il bénéficie de rappels pour comprendre et respecter les règles de vie de la classe.'],
    ['L’élève utilise les affiches, les pictogrammes ou la minuterie pour suivre les règles de vie.', 'Il bénéficie de rappels pour utiliser les affiches, les pictogrammes ou la minuterie qui soutiennent les règles de vie.'],
    ['L’élève respecte les autres dans ses gestes et ses paroles.', 'Il apprend à choisir des gestes et des paroles qui respectent les autres.'],
    ['L’élève attend son tour et accepte de courts délais dans les activités.', 'Il bénéficie de repères et de soutien pour attendre son tour et accepter de courts délais.'],
    ['L’élève passe d’une activité à l’autre en suivant les repères de la journée.', 'Il bénéficie de soutien pour passer d’une activité à l’autre au fil de la journée.'],
    ['L’élève décrit ce qui s’est passé dans un conflit, propose des solutions et fait des compromis.', 'Il bénéficie de soutien pour décrire ce qui s’est passé dans un conflit, proposer des solutions et faire des compromis.'],
    ['L’élève essaie les étapes proposées pour résoudre un conflit.', 'Il bénéficie de l’accompagnement de l’adulte pour essayer les étapes proposées lors d’un conflit.']
  ],
  presco_c4: [
    ['L’élève porte attention à la personne qui parle et respecte le tour de parole.', 'Il bénéficie de repères pour porter attention à la personne qui parle et respecter le tour de parole.'],
    ['L’élève participe aux discussions et aux causeries.', 'Il bénéficie d’encouragements pour participer aux discussions et aux causeries.'],
    ['L’élève intervient en lien avec le sujet de conversation.', 'Il bénéficie de rappels pour faire des liens entre ses interventions et le sujet de conversation.'],
    ['L’élève formule des demandes et pose des questions pour exprimer ses besoins ou obtenir de l’information.', 'Il bénéficie de modèles pour formuler des demandes et poser des questions.'],
    ['L’élève poursuit ses efforts pour utiliser le français dans ses échanges.', 'Il bénéficie de modèles et d’occasions de parler français dans des échanges signifiants.'],
    ['L’élève montre sa compréhension des messages et des consignes par ses actions.', 'Il bénéficie de reformulations ou de gestes pour comprendre les messages et les consignes.'],
    ['L’élève se fait comprendre à l’aide de mots, de gestes ou d’expressions du visage.', 'Il bénéficie de soutien pour exprimer ses idées à l’aide de mots, de gestes ou d’expressions du visage.'],
    ['L’élève utilise des phrases simples et en enrichit progressivement la structure.', 'Il bénéficie de modèles pour construire des phrases et en enrichir la structure.'],
    ['L’élève précise son message pour en faciliter la compréhension.', 'Il bénéficie de questions de l’adulte pour préciser son message.'],
    ['L’élève raconte dans ses mots une histoire, une consigne ou un événement vu ou entendu.', 'Il bénéficie de soutien pour redire dans ses mots une histoire, une consigne ou un événement vu ou entendu.'],
    ['L’élève organise ses idées pour expliquer quelque chose ou raconter un événement.', 'Il bénéficie de repères pour organiser ses idées avant d’expliquer quelque chose ou de raconter un événement.'],
    ['L’élève choisit des mots de plus en plus précis pour exprimer ses idées.', 'Il bénéficie de modèles et de reformulations pour enrichir et préciser son vocabulaire.'],
    ['L’élève joue avec les syllabes à l’oral, repère des rimes et reconnaît des sons au début des mots.', 'Il bénéficie de soutien dans les jeux oraux portant sur les syllabes, les rimes et les sons au début des mots.'],
    ['L’élève reconnaît des lettres de l’alphabet et associe certaines d’entre elles à leur nom et à leur son.', 'Il bénéficie d’occasions ludiques d’explorer les lettres, leur nom et leur son.'],
    ['L’élève explore les livres et reconnaît son prénom ou celui de quelques camarades dans les activités d’éveil à la lecture.', 'Il bénéficie d’un accompagnement pour explorer les livres et repérer son prénom ou celui de quelques camarades.'],
    ['L’élève explore l’écrit en essayant d’écrire son prénom, en jouant avec les lettres ou en faisant des tentatives d’écriture.', 'Il bénéficie d’encouragements pour explorer l’écrit, par exemple en essayant d’écrire son prénom, en jouant avec les lettres ou en faisant des tentatives d’écriture.']
  ],
  presco_c5: [
    ['L’élève s’engage dans les activités et les projets en manipulant, en proposant des idées ou en faisant des essais.', 'Il bénéficie d’un accompagnement pour s’engager dans les activités et les projets et y faire des essais.'],
    ['L’élève accepte de découvrir de nouvelles activités.', 'Il bénéficie d’encouragements pour découvrir de nouvelles activités.'],
    ['L’élève explore les nombres et les formes en comptant, en dénombrant, en reconnaissant des chiffres et en découvrant des formes géométriques.', 'Il bénéficie de soutien dans les jeux qui invitent à compter, à dénombrer, à reconnaître des chiffres et à découvrir des formes géométriques.'],
    ['L’élève observe ce qui l’entoure et pose des questions pour en savoir plus.', 'Il bénéficie de questions de l’adulte pour observer ce qui l’entoure et exprimer sa curiosité.'],
    ['L’élève fait des liens entre ses expériences, ses connaissances et les activités de la classe.', 'Il bénéficie de questions pour faire des liens entre ses expériences, ses connaissances et les activités de la classe.'],
    ['L’élève invente des idées et transforme le matériel dans les jeux symboliques, les bricolages et les constructions.', 'Il bénéficie de propositions ouvertes pour explorer son imagination dans les jeux symboliques, les bricolages et les constructions.'],
    ['L’élève propose et essaie des solutions aux petits problèmes du quotidien.', 'Il bénéficie de soutien pour proposer et essayer des solutions aux petits problèmes du quotidien.'],
    ['L’élève essaie différentes façons d’apprendre, comme observer, manipuler et poser des questions.', 'Il bénéficie d’un accompagnement pour essayer différentes façons d’apprendre, comme observer, manipuler et poser des questions.'],
    ['L’élève poursuit ses essais pour terminer un jeu, une activité ou un projet.', 'Il bénéficie de soutien pour poursuivre ses essais et terminer un jeu, une activité ou un projet.'],
    ['L’élève raconte les étapes de son activité ou de son jeu.', 'Il bénéficie de questions ou d’images pour raconter les étapes de son activité ou de son jeu.']
  ]
};

const PRESCHOOL_COMMENT_SUPPORT = {
  presco_c1: [
    'Il s’exerce dans de courts jeux moteurs avec du matériel varié et adapté à ses possibilités.',
    'Il utilise des repères visuels et la démonstration de l’adulte pour essayer un nouveau geste.',
    'Il prend part à des jeux qui lui permettent de découvrir ses besoins de mouvement et de détente.'
  ],
  presco_c2: [
    'Il utilise des images et les mots proposés par l’adulte pour nommer ses émotions et ses besoins.',
    'Il s’appuie sur une routine illustrée pour entreprendre une action par lui-même.',
    'Il choisit entre quelques possibilités et revient avec l’adulte sur ses essais et ses réussites.'
  ],
  presco_c3: [
    'Il s’exerce à entrer dans un jeu avec un petit groupe et l’appui de l’adulte.',
    'Il utilise des images ou des mots proposés en classe pour exprimer un désaccord et chercher une solution.',
    'Il s’appuie sur les repères visuels de la classe pour anticiper son tour et les transitions.'
  ],
  presco_c4: [
    'Il participe à des lectures partagées où les images, les gestes et les échanges soutiennent sa compréhension.',
    'Il reprend des mots et des formulations proposés par l’adulte dans les jeux et les échanges.',
    'Il explore les sons, les lettres et les tentatives d’écriture dans des jeux, sans exigence de lecture ou d’écriture conventionnelle.'
  ],
  presco_c5: [
    'Il manipule du matériel concret pour comparer, classer, compter et vérifier ses idées dans les jeux.',
    'Il essaie une autre façon de faire avec l’aide de questions ouvertes de l’adulte.',
    'Il utilise des photos de ses réalisations pour raconter ses essais et ses découvertes.'
  ]
};

const PRESCHOOL_COMMENT_REVIEW = {
  presco_c1: ['L’élève élargit ses possibilités de mouvement et de manipulation dans les jeux de la classe.', 'Il poursuit le développement de son autonomie dans les soins personnels et les activités motrices.'],
  presco_c2: ['L’élève exprime davantage ses préférences et prend sa place dans les activités de la classe.', 'Il poursuit la découverte de ses capacités et des moyens qui l’aident à vivre ses émotions.'],
  presco_c3: ['L’élève développe des façons de jouer et de vivre avec les autres dans la classe.', 'Il poursuit ses essais pour collaborer avec les autres et résoudre les désaccords.'],
  presco_c4: ['L’élève élargit ses moyens de communiquer dans les jeux et les échanges de la classe.', 'Il poursuit ses découvertes de la langue orale et écrite à travers des expériences variées.'],
  presco_c5: ['L’élève enrichit sa compréhension du monde par ses jeux, ses questions et ses découvertes.', 'Il poursuit ses explorations en reliant ses essais à ses expériences et à ses connaissances.']
};

function makeCommentBankCategories(forces, defis, strategies, bilan, preschool = false) {
  return [
    { id: 'forces', label: preschool ? 'Progrès observés' : 'Forces et acquis', phrases: forces },
    { id: 'defis', label: 'Défis', phrases: defis },
    { id: 'strategies', label: preschool ? 'Moyens et soutien' : 'Stratégies et soutien', phrases: strategies },
    { id: 'bilan', label: 'Bilan', phrases: bilan }
  ];
}

const PRESCHOOL_COMMENT_BANKS = Object.fromEntries(Object.entries(PRESCHOOL_COMMENT_OBSERVATIONS).map(([id, pairs]) => [
  id, makeCommentBankCategories(pairs.map(pair => pair[0]), pairs.map(pair => pair[1]), PRESCHOOL_COMMENT_SUPPORT[id], PRESCHOOL_COMMENT_REVIEW[id], true)
]));
const PRESCHOOL_GENERIC_COMMENT_BANK = makeCommentBankCategories(
  ['L’élève essaie de nouvelles façons de faire dans ses jeux.', 'Il communique ses besoins par des mots ou des gestes.'],
  ['Il bénéficie de soutien pour entreprendre une activité.', 'Il bénéficie de repères pour suivre les routines de la journée.'],
  ['Il s’appuie sur la démonstration de l’adulte pour faire un nouvel essai.', 'Il explore du matériel varié à son rythme dans les jeux.'],
  ['L’élève poursuit ses découvertes dans les activités de la classe.', 'Il développe ses capacités grâce aux jeux et aux échanges avec les autres.'], true
);

// Repères de rédaction par cycle et compétence; à ajuster aux apprentissages réellement travaillés.
const PRIMARY_COMMENT_BANKS = {
  1: {
    fra_lecture: makeCommentBankCategories(
      ['L’élève combine les lettres et les sons pour lire les mots des textes abordés en classe.', 'Il repère les informations écrites clairement dans un court texte.', 'Il raconte les principaux événements d’une histoire et exprime sa réaction.'],
      ['Il bénéficie de soutien pour combiner les lettres et les sons et reconnaître les mots.', 'Il apprend à retourner au texte pour retrouver une information.', 'Il bénéficie de questions pour raconter les événements dans l’ordre et expliquer sa réaction.'],
      ['Il relit un passage et s’aide du sens de la phrase pour vérifier le mot lu.', 'Il utilise les illustrations et les échanges autour du texte pour vérifier sa compréhension.'],
      ['L’élève réutilise ses stratégies de lecture dans les courts textes proposés en classe.']
    ),
    fra_ecriture: makeCommentBankCategories(
      ['L’élève écrit de courts textes en lien avec le sujet proposé.', 'Il présente ses idées dans un ordre qui aide à comprendre son message.', 'Il applique les correspondances entre les lettres et les sons et orthographie les mots appris.'],
      ['Il bénéficie de soutien pour formuler ses idées avant de les écrire.', 'Il apprend à délimiter ses phrases par une majuscule et un point.', 'Il bénéficie de rappels pour vérifier l’orthographe des mots appris et les accords travaillés en classe.'],
      ['Il dit sa phrase à voix haute avant de l’écrire.', 'Il relit son texte à l’aide des outils de la classe pour vérifier le sens et les éléments travaillés.'],
      ['L’élève enrichit ses courts textes en reprenant les suggestions reçues.']
    ),
    fra_oral: makeCommentBankCategories(
      ['L’élève présente ses idées à l’oral en lien avec le sujet de l’échange.', 'Il écoute les propos des autres et y réagit par une réponse ou une question.', 'Il utilise une voix audible et des mots qui aident à comprendre son message.'],
      ['Il bénéficie de questions pour préciser son idée à l’oral.', 'Il apprend à respecter le tour de parole et à tenir compte des propos des autres.', 'Il bénéficie de rappels pour ajuster le volume de sa voix à la situation.'],
      ['Il prépare son message à l’aide d’un dessin ou de quelques mots-clés.', 'Il s’exerce avec un partenaire avant de prendre la parole devant le groupe.'],
      ['L’élève développe ses moyens d’exprimer ses idées et de participer aux échanges.']
    ),
    math_resoudre: makeCommentBankCategories(
      ['L’élève repère les informations utiles dans une situation-problème accessible à son cycle.', 'Il représente la situation à l’aide d’objets, de dessins ou de nombres.', 'Il présente une solution qui tient compte de ce qui est demandé.'],
      ['Il bénéficie de soutien pour préciser ce qui est recherché dans une situation-problème.', 'Il apprend à représenter les informations utiles avant de chercher une solution.', 'Il bénéficie de questions pour vérifier si sa solution répond à la situation.'],
      ['Il reformule la situation dans ses mots et la représente avec du matériel.', 'Il explique ses essais à l’aide de dessins, de nombres et de mots.'],
      ['L’élève développe ses moyens de représenter une situation-problème et d’y chercher une solution.']
    ),
    math_raisonner: makeCommentBankCategories(
      ['L’élève utilise les nombres et les opérations travaillés pour traiter les situations proposées.', 'Il reconnaît et décrit les caractéristiques des figures abordées en classe.', 'Il explique son raisonnement à l’aide de matériel, de dessins ou de mots.'],
      ['Il bénéficie de soutien pour représenter les nombres et choisir une opération appropriée.', 'Il apprend à vérifier ses calculs et à comparer différentes façons de faire.', 'Il bénéficie de questions pour expliquer les étapes de son raisonnement.'],
      ['Il utilise des objets, des dessins ou une droite numérique pour vérifier son raisonnement.', 'Il compare ses démarches et explique le sens des symboles utilisés.'],
      ['L’élève consolide ses connaissances mathématiques en les utilisant dans des situations variées.']
    ),
    autres: makeCommentBankCategories(
      ['L’élève utilise les connaissances travaillées pour réaliser les activités de la matière.', 'Il décrit ses observations et ses réalisations avec les mots appris en classe.', 'Il essaie les façons de faire présentées et explique certains de ses choix.'],
      ['Il bénéficie de soutien pour faire des liens entre les consignes et les connaissances travaillées.', 'Il apprend à décrire ses observations ou sa réalisation avec plus de précision.', 'Il bénéficie de questions pour expliquer un choix ou une façon de faire.'],
      ['Il s’appuie sur un exemple et sur le matériel proposé pour entreprendre la tâche.', 'Il revient sur sa réalisation avec l’adulte pour nommer une réussite et un élément à reprendre.'],
      ['L’élève réutilise ce qui a été exploré en classe dans de nouvelles activités de la matière.']
    )
  },
  2: {
    fra_lecture: makeCommentBankCategories(
      ['L’élève dégage les informations importantes et les idées principales des textes lus.', 'Il fait des liens entre les indices du texte et ses connaissances pour comprendre les informations sous-entendues.', 'Il explique sa réaction à un texte en s’appuyant sur des éléments de sa lecture.'],
      ['Il bénéficie de soutien pour distinguer l’information importante des détails.', 'Il apprend à réunir plusieurs indices pour comprendre une information sous-entendue.', 'Il bénéficie de questions pour appuyer sa réaction sur des éléments précis du texte.'],
      ['Il résume les passages dans ses mots pour vérifier sa compréhension.', 'Il repère les indices du texte et explique les liens qui soutiennent sa réponse.'],
      ['L’élève approfondit sa compréhension en justifiant ses réponses par des éléments des textes lus.']
    ),
    fra_ecriture: makeCommentBankCategories(
      ['L’élève développe ses idées en tenant compte du sujet et de l’intention d’écriture.', 'Il regroupe les idées liées entre elles dans des paragraphes pour organiser son texte.', 'Il révise ses phrases et applique les règles d’orthographe et d’accord travaillées en classe.'],
      ['Il bénéficie de soutien pour développer ses idées à l’aide de détails pertinents.', 'Il apprend à regrouper ses idées en paragraphes et à respecter un ordre logique dans son texte.', 'Il bénéficie de rappels pour vérifier la structure des phrases, la ponctuation et les accords étudiés.'],
      ['Il planifie les idées de son texte avant la rédaction et ajuste son plan au besoin.', 'Il relit son texte en vérifiant un élément à la fois et consulte ses outils de référence.'],
      ['L’élève améliore la clarté de ses textes en réinvestissant les stratégies de révision travaillées.']
    ),
    fra_oral: makeCommentBankCategories(
      ['L’élève organise ses propos pour présenter clairement une idée ou une information.', 'Il fait des liens avec les interventions des autres pour poursuivre l’échange.', 'Il choisit un vocabulaire précis et ajuste sa voix pour se faire comprendre.'],
      ['Il bénéficie de repères pour organiser ses propos et éviter de s’éloigner du sujet.', 'Il apprend à reformuler ce qui a été dit et à poser des questions liées à l’échange.', 'Il bénéficie de rétroactions pour préciser son vocabulaire et améliorer la clarté de ses propos.'],
      ['Il s’appuie sur des mots-clés pour préparer une prise de parole sans réciter un texte.', 'Il reformule le message d’un autre avant d’ajouter une idée ou de poser une question.'],
      ['L’élève enrichit ses prises de parole en tenant compte du sujet et des échanges avec les autres.']
    ),
    math_resoudre: makeCommentBankCategories(
      ['L’élève sélectionne les informations et les contraintes utiles pour comprendre la situation-problème.', 'Il organise une démarche qui combine les connaissances mathématiques nécessaires.', 'Il présente sa solution en laissant des traces qui permettent de suivre sa démarche.'],
      ['Il bénéficie de soutien pour tenir compte de toutes les contraintes de la situation-problème.', 'Il apprend à choisir et à enchaîner les étapes de sa démarche.', 'Il bénéficie de questions pour vérifier sa solution et en expliquer les étapes.'],
      ['Il construit un schéma ou un tableau pour organiser les informations de la situation.', 'Il revient à la question et aux contraintes pour vérifier la cohérence de sa solution.'],
      ['L’élève organise de mieux en mieux sa démarche pour résoudre les situations-problèmes proposées.']
    ),
    math_raisonner: makeCommentBankCategories(
      ['L’élève choisit les concepts et les processus mathématiques appropriés à la situation.', 'Il effectue les calculs et les mesures nécessaires en laissant des traces compréhensibles.', 'Il justifie ses conclusions à l’aide de propriétés, de représentations ou de calculs.'],
      ['Il bénéficie de soutien pour choisir les connaissances mathématiques utiles à la situation.', 'Il apprend à vérifier l’exactitude de ses calculs et la cohérence de ses résultats.', 'Il bénéficie de questions pour appuyer une conclusion sur des arguments mathématiques.'],
      ['Il compare des représentations et nomme les propriétés qui soutiennent son choix.', 'Il estime le résultat attendu avant de calculer, puis le compare au résultat obtenu.'],
      ['L’élève précise son raisonnement en expliquant les connaissances mathématiques utilisées.']
    ),
    autres: makeCommentBankCategories(
      ['L’élève établit des liens entre les connaissances de la matière et la situation proposée.', 'Il organise les informations ou les observations recueillies pour réaliser la tâche.', 'Il explique ses choix en utilisant le vocabulaire propre à la matière.'],
      ['Il bénéficie de soutien pour sélectionner les informations pertinentes à la tâche.', 'Il apprend à relier ses observations aux connaissances travaillées.', 'Il bénéficie de questions pour expliquer ses choix à partir de sa démarche ou de sa réalisation.'],
      ['Il classe ses observations et consulte les ressources proposées avant de tirer une conclusion.', 'Il utilise les critères présentés pour revoir sa démarche ou sa réalisation.'],
      ['L’élève approfondit ses apprentissages en expliquant les liens entre ses observations et ses choix.']
    )
  },
  3: {
    fra_lecture: makeCommentBankCategories(
      ['L’élève met en relation les idées du texte pour en dégager une compréhension d’ensemble.', 'Il justifie son interprétation à partir d’indices pertinents et de ses connaissances.', 'Il porte un jugement sur un texte en s’appuyant sur des critères et des exemples de sa lecture.'],
      ['Il bénéficie de soutien pour mettre en relation des informations réparties dans le texte.', 'Il apprend à distinguer ce que le texte permet de comprendre de ses impressions personnelles.', 'Il bénéficie de questions pour préciser son jugement et le justifier par des exemples pertinents.'],
      ['Il confronte son interprétation aux indices du texte et la révise au besoin.', 'Il compare des textes et utilise des critères explicites pour expliquer son appréciation.'],
      ['L’élève affine sa compréhension et son appréciation en appuyant ses réponses sur les textes.']
    ),
    fra_ecriture: makeCommentBankCategories(
      ['L’élève développe des idées pertinentes en adaptant son texte à l’intention et au destinataire.', 'Il assure la continuité de ses idées par l’organisation des paragraphes et les liens entre les phrases.', 'Il révise son texte pour préciser le vocabulaire, varier les phrases et corriger les erreurs selon les notions étudiées.'],
      ['Il bénéficie de soutien pour sélectionner et développer les idées qui servent son intention d’écriture.', 'Il apprend à vérifier la progression de ses idées et la clarté des reprises de l’information.', 'Il bénéficie de rappels pour justifier et appliquer ses corrections à l’aide des règles étudiées.'],
      ['Il relit son texte du point de vue du destinataire pour repérer les passages à clarifier.', 'Il utilise une démarche de révision et consulte ses références pour valider ses corrections.'],
      ['L’élève rend ses textes plus cohérents et plus précis grâce à une révision réfléchie.']
    ),
    fra_oral: makeCommentBankCategories(
      ['L’élève adapte ses propos et son registre de langue à la situation de communication.', 'Il développe ses idées à l’aide d’explications et d’exemples pertinents.', 'Il tient compte des points de vue exprimés pour enrichir l’échange et préciser sa pensée.'],
      ['Il bénéficie de repères pour hiérarchiser ses idées et adapter ses propos à son auditoire.', 'Il apprend à appuyer son point de vue sur des explications et des exemples liés au sujet.', 'Il bénéficie de rétroactions pour nuancer ses réactions et tenir compte des propos des autres.'],
      ['Il prépare les idées essentielles de son message et s’exerce à les reformuler selon l’auditoire.', 'Il résume les points de vue exprimés avant de préciser son accord ou son désaccord.'],
      ['L’élève développe des prises de parole structurées et contribue à faire avancer les échanges.']
    ),
    math_resoudre: makeCommentBankCategories(
      ['L’élève analyse les données et les contraintes pour construire une représentation cohérente de la situation-problème.', 'Il élabore une démarche qui articule plusieurs connaissances mathématiques.', 'Il explicite les étapes de sa solution en laissant des traces claires et complètes.'],
      ['Il bénéficie de soutien pour distinguer les données utiles et prendre en compte les contraintes implicites.', 'Il apprend à ajuster sa démarche lorsque ses premiers essais ne permettent pas de résoudre la situation.', 'Il bénéficie de questions pour valider la solution et rendre explicites les liens entre ses étapes.'],
      ['Il organise sa démarche dans un schéma, un tableau ou des expressions mathématiques, puis ajuste sa représentation.', 'Il vérifie sa solution par une autre démarche ou en la confrontant à chacune des contraintes.'],
      ['L’élève développe une démarche de résolution plus structurée et vérifie la portée de ses résultats.']
    ),
    math_raisonner: makeCommentBankCategories(
      ['L’élève mobilise les concepts et les processus appropriés pour analyser la situation mathématique.', 'Il effectue les opérations et les transformations nécessaires avec précision.', 'Il appuie ses conclusions sur des propriétés mathématiques et une argumentation cohérente.'],
      ['Il bénéficie de soutien pour reconnaître les relations mathématiques utiles à son raisonnement.', 'Il apprend à contrôler les étapes de ses calculs et à vérifier la cohérence des unités ou des représentations.', 'Il bénéficie de questions pour construire une justification plutôt que de présenter seulement un résultat.'],
      ['Il compare plusieurs démarches et explique pourquoi elles conviennent à la situation.', 'Il s’appuie sur des exemples, des contre-exemples ou des propriétés pour vérifier ses conclusions.'],
      ['L’élève consolide la rigueur de son raisonnement en rendant ses justifications plus explicites.']
    ),
    autres: makeCommentBankCategories(
      ['L’élève mobilise les connaissances de la matière pour analyser la situation ou développer sa réalisation.', 'Il met en relation les informations et les observations pertinentes à la tâche.', 'Il justifie ses choix en s’appuyant sur des connaissances et sur les critères présentés.'],
      ['Il bénéficie de soutien pour établir des liens entre plusieurs informations ou observations.', 'Il apprend à distinguer ses impressions des éléments qui appuient son explication ou son appréciation.', 'Il bénéficie de questions pour justifier ses choix avec plus de précision.'],
      ['Il compare les ressources disponibles et retient les informations utiles à sa démarche.', 'Il confronte sa réalisation aux critères présentés et explique les ajustements retenus.'],
      ['L’élève approfondit ses apprentissages en révisant sa démarche et en justifiant ses choix.']
    )
  }
};

function getCommentBankCategories(student, subject) {
  const cycle = getStudentCycle(student && student.gradeLevel);
  const subjectConfig = typeof subject === 'string'
    ? ALL_SUBJECTS_CONFIG.find(item => item.id === subject) || { id: subject } : subject;
  if (cycle === 'P') {
    return PRESCHOOL_COMMENT_BANKS[subjectConfig && subjectConfig.id] || PRESCHOOL_GENERIC_COMMENT_BANK;
  }
  const cycleBank = PRIMARY_COMMENT_BANKS[cycle];
  if (!cycleBank) return COMMENT_BANK_CATEGORIES;
  const subjectKey = getPrimaryCommentSubjectKey(subjectConfig);
  const feedbackOnly = cycle === 1 && ['sciences', 'social'].includes(subjectKey);
  const categories = feedbackOnly ? makeCommentBankCategories([], [], [], [])
    : PRIMARY_SUBJECT_COMMENT_BANKS[cycle][subjectKey] || cycleBank[subjectKey] || cycleBank.autres;
  const transversal = PRIMARY_TRANSVERSAL_COMMENT_BANKS[cycle];
  return categories.map(category => ({
    ...category,
    phrases: category.phrases.concat(transversal.find(item => item.id === category.id).phrases)
  }));
}

// Correspondance avec les trois éléments d’observation de chaque domaine dans les grilles locales.
const PRESCHOOL_SYNTHESIS_OBSERVATIONS = {
  presco_c1: [0, 3, 8], presco_c2: [8, 4, 12], presco_c3: [4, 9, 14],
  presco_c4: [5, 7, 14], presco_c5: [3, 2, 6]
};

// Les constats restent un choix professionnel : aucun seuil numérique ne les détermine.
Object.entries(PRESCHOOL_COMMENT_BANKS).forEach(([id, categories]) => {
  const subject = ALL_SUBJECTS_CONFIG.find(item => item.id === id);
  const competency = subject ? subject.shortName.split(' — ').slice(1).join(' — ') : '';
  if (!competency) return;
  categories.find(category => category.id === 'bilan').phrases.push(...[
    'très bien', 'adéquatement', 'avec certaines difficultés', 'avec des difficultés importantes'
  ].map(constat => `L’élève se développe ${constat} au regard de la compétence « ${competency} ».`));
});

// Observations transversales : elles ne constituent pas des critères de notation disciplinaire.
const PRIMARY_TRANSVERSAL_COMMENT_BANKS = {
  1: makeCommentBankCategories(
    ['Pour organiser son travail, l’élève nomme les étapes de la tâche et rassemble le matériel nécessaire.', 'Pour communiquer, il prépare son message et choisit des mots ou des gestes qui aident à le comprendre.', 'Pour exercer son jugement critique, il compare son idée avec celle d’un autre et dit ce qui lui paraît juste.', 'Pour travailler en équipe, il fait sa part et suit les règles convenues avec les autres.'],
    ['Pour organiser son travail, il bénéficie de repères pour suivre les étapes et ranger son matériel.', 'Pour communiquer, il bénéficie de questions pour préciser son message et vérifier si les autres comprennent.', 'Pour exercer son jugement critique, il apprend à écouter une autre idée avant d’exprimer son opinion.', 'Pour travailler en équipe, il bénéficie de soutien pour partager les tâches et respecter les règles convenues.'],
    ['Il utilise une courte liste illustrée pour suivre les étapes de son travail.', 'Il reformule son message lorsqu’un autre lui indique ne pas comprendre.', 'Il donne un exemple pour expliquer son opinion et écoute celui proposé par un autre.', 'Il nomme avec ses partenaires la tâche de chaque membre de l’équipe.'],
    []
  ),
  2: makeCommentBankCategories(
    ['Pour organiser son travail, l’élève choisit les ressources utiles et ajuste ses étapes en cours de tâche.', 'Pour communiquer, il organise son message et l’ajuste selon les réactions des autres.', 'Pour exercer son jugement critique, il compare les points de vue et donne des raisons pour appuyer son opinion.', 'Pour travailler en équipe, il assume sa responsabilité et contribue aux règles de fonctionnement du groupe.'],
    ['Pour organiser son travail, il bénéficie de soutien pour gérer le temps et respecter les échéances.', 'Pour communiquer, il apprend à repérer les signes d’incompréhension et à reformuler ses propos.', 'Pour exercer son jugement critique, il bénéficie de questions pour comparer les raisons qui appuient différents points de vue.', 'Pour travailler en équipe, il apprend à tenir compte des propositions des autres dans les décisions du groupe.'],
    ['Il vérifie son avancement à l’aide des étapes prévues et se fixe un défi pour la prochaine tâche.', 'Il demande une rétroaction sur la clarté de son message et détermine un élément à améliorer.', 'Il relève les ressemblances et les différences entre les points de vue avant de préciser le sien.', 'Il fait le point avec ses partenaires sur la répartition des tâches et les ajustements nécessaires.'],
    []
  ),
  3: makeCommentBankCategories(
    ['Pour organiser son travail, l’élève planifie ses ressources et son temps, puis évalue l’efficacité de sa démarche.', 'Pour communiquer, il adapte les moyens utilisés à son intention et à son destinataire, puis évalue leur efficacité.', 'Pour exercer son jugement critique, il examine les raisons qui soutiennent les points de vue et nuance son opinion.', 'Pour travailler en équipe, il coordonne ses actions avec celles des autres et contribue à résoudre les difficultés du groupe.'],
    ['Pour organiser son travail, il apprend à anticiper les obstacles et à ajuster sa planification.', 'Pour communiquer, il bénéficie de rétroactions pour vérifier l’effet de son message et choisir les ajustements utiles.', 'Pour exercer son jugement critique, il apprend à remettre en question ses premières impressions en examinant les informations disponibles.', 'Pour travailler en équipe, il bénéficie de soutien pour négocier les décisions et évaluer sa contribution au travail collectif.'],
    ['Il compare sa planification au déroulement réel de la tâche pour choisir une stratégie à améliorer.', 'Il explique les choix faits pour communiquer et ajuste son message à partir des réactions reçues.', 'Il recherche des informations qui confirment ou remettent en question son opinion avant de la préciser.', 'Il analyse avec son équipe l’effet des règles de fonctionnement et propose des ajustements.'],
    []
  )
};

// Formulations locales tirées des critères et des annexes des cadres MEQ.
// Les moyens et retours réflexifs demeurent de la rétroaction : aucun résultat n’est créé ici.
const PRIMARY_SUBJECT_COMMENT_BANKS = {
  1: {
    ccq: makeCommentBankCategories(
      ['L’élève décrit des réalités culturelles étudiées à l’aide de mots et d’exemples appropriés.', 'Il pose des questions claires sur les réalités observées.', 'Il relève des ressemblances et des différences entre des observations liées au sujet étudié.'],
      ['Il bénéficie de soutien pour décrire une réalité culturelle à partir des connaissances travaillées.', 'Il apprend à formuler une question en lien avec ce qui est observé.', 'Il bénéficie de questions pour comparer des observations et expliquer ce qui se ressemble ou diffère.'],
      ['Il s’appuie sur des images, des récits ou des situations fictives pour explorer une réalité culturelle.', 'Il regroupe ses observations et les présente à l’aide des mots appris en classe.'],
      ['L’élève élargit sa compréhension des réalités culturelles explorées en classe.']
    ),
    art_plast_creer: makeCommentBankCategories(
      ['L’élève utilise des lignes, des formes et des couleurs en lien avec la proposition de création.', 'Il réalise les gestes nécessaires pour transformer les matériaux avec les outils proposés.', 'Il organise les éléments de son image pour exprimer une idée personnelle.'],
      ['Il bénéficie de soutien pour choisir des éléments visuels liés à son idée de départ.', 'Il apprend à ajuster ses gestes aux matériaux et aux outils utilisés.', 'Il bénéficie de questions pour organiser les formes et les couleurs dans son image.'],
      ['Il fait des essais avec les matériaux avant de retenir une façon de réaliser son image.', 'Il raconte les étapes importantes de sa création et nomme un choix personnel.'],
      ['L’élève développe ses moyens d’exprimer une idée par une création plastique personnelle.']
    ),
    art_plast_apprecier: makeCommentBankCategories(
      ['L’élève repère des lignes, des formes et des couleurs dans les images observées.', 'Il exprime son appréciation d’une image à partir d’un élément visible.', 'Il utilise les mots appris en arts plastiques pour décrire ce qui attire son attention.'],
      ['Il bénéficie de questions pour observer les éléments visibles d’une image.', 'Il apprend à relier sa préférence à un élément de l’image.', 'Il bénéficie de modèles pour utiliser le vocabulaire des arts plastiques.'],
      ['Il observe une image en nommant ce qui attire son regard avant de donner son appréciation.', 'Il compare deux images à partir de leurs formes ou de leurs couleurs.'],
      ['L’élève enrichit sa façon d’observer les images et d’en parler.']
    ),
    anglais: makeCommentBankCategories(
      ['L’élève montre sa compréhension de chansons, de comptines ou de récits entendus en anglais par des mots et des gestes appropriés.', 'Il reprend des mots et des expressions entendus dans les passages répétitifs des textes.', 'Il réagit aux messages oraux en anglais et utilise de courtes expressions pour communiquer.'],
      ['Il bénéficie de gestes et de répétitions pour comprendre les textes entendus en anglais.', 'Il apprend à reprendre des mots et des expressions pour participer aux chansons, aux comptines ou aux récits.', 'Il bénéficie de modèles pour amorcer un échange oral en anglais ou répondre à un message.'],
      ['Il s’appuie sur les gestes et les expressions proposés par l’adulte pour participer aux échanges.', 'Il réécoute de courts passages et imite les façons de faire montrées en classe.'],
      ['L’élève développe sa compréhension de l’anglais entendu et ses moyens de communiquer à l’oral.']
    ),
    eps: makeCommentBankCategories(
      ['L’élève choisit des actions motrices qui correspondent à ses possibilités et aux consignes de l’activité.', 'Il réalise les actions demandées en respectant les règles de sécurité.', 'Il coopère avec les autres pour réaliser les activités physiques proposées.'],
      ['Il bénéficie de soutien pour choisir des actions motrices adaptées à la situation.', 'Il apprend à ajuster ses mouvements et à appliquer les règles de sécurité pendant l’activité.', 'Il bénéficie de rappels pour communiquer avec ses partenaires et suivre les règles du jeu.'],
      ['Il décrit une réussite et un élément à reprendre après une activité physique.', 'Il essaie différentes façons de réaliser une action et reconnaît des habitudes qui soutiennent une vie active.'],
      ['L’élève développe des façons d’agir et de coopérer dans les activités physiques de la classe.']
    )
  },
  2: {
    ccq: makeCommentBankCategories(
      ['L’élève explique des caractéristiques des réalités culturelles étudiées à l’aide des connaissances travaillées.', 'Il formule des questions pertinentes et organise les observations recueillies.', 'Il compare des réalités culturelles en relevant des ressemblances et des différences pertinentes.'],
      ['Il bénéficie de soutien pour utiliser les connaissances travaillées dans ses explications.', 'Il apprend à sélectionner les observations qui répondent à sa question.', 'Il bénéficie de questions pour comparer les réalités culturelles étudiées sans se limiter à une première impression.'],
      ['Il utilise un tableau pour organiser des observations issues de documents ou de situations proposées en classe.', 'Il revient aux informations recueillies pour vérifier ses comparaisons.'],
      ['L’élève approfondit sa compréhension des réalités culturelles en examinant les observations et les informations disponibles.']
    ),
    sciences: makeCommentBankCategories(
      ['L’élève reformule le problème scientifique ou technologique et propose une première explication ou solution.', 'Il réalise une démarche liée au problème en utilisant les instruments et les techniques de façon sécuritaire.', 'Il explique ses observations ou sa solution à l’aide des connaissances scientifiques et des mots appris.'],
      ['Il bénéficie de questions pour préciser le problème et proposer une explication ou une solution à essayer.', 'Il apprend à organiser les étapes de ses essais et à utiliser les instruments de façon appropriée.', 'Il bénéficie de soutien pour relier ses observations aux connaissances scientifiques travaillées.'],
      ['Il conserve des traces de ses observations pour comparer ses essais.', 'Il ajuste sa démarche lorsque les observations ne correspondent pas à son explication de départ.'],
      ['L’élève développe des explications et des solutions en s’appuyant sur ses observations et les connaissances travaillées.']
    ),
    social: makeCommentBankCategories(
      ['L’élève situe les sociétés étudiées dans le temps et sur leur territoire.', 'Il décrit des caractéristiques d’une société et fait des liens avec son territoire.', 'Il relève des changements ou des différences entre les sociétés étudiées en s’appuyant sur des faits.'],
      ['Il bénéficie de soutien pour situer les faits sur une ligne du temps ou sur une carte.', 'Il apprend à relier les caractéristiques d’une société à celles de son territoire.', 'Il bénéficie de questions pour comparer des faits et reconnaître un changement ou une différence.'],
      ['Il repère des informations dans les documents proposés et les classe selon la question de recherche.', 'Il utilise une carte ou une ligne du temps pour organiser ses observations et vérifier ses repères.'],
      ['L’élève enrichit sa compréhension des sociétés étudiées en reliant des faits et des caractéristiques de leur territoire.']
    ),
    art_plast_creer: makeCommentBankCategories(
      ['L’élève choisit des éléments du langage plastique qui soutiennent son idée de création.', 'Il transforme les matériaux en utilisant les gestes et les outils appropriés.', 'Il organise les éléments et représente l’espace de façon cohérente avec sa proposition de départ.'],
      ['Il bénéficie de soutien pour choisir les formes, les couleurs ou les textures qui expriment son idée.', 'Il apprend à contrôler ses gestes selon les matériaux et les effets recherchés.', 'Il bénéficie de questions pour organiser l’espace et développer une image personnelle.'],
      ['Il compare les effets de ses essais avant de choisir les gestes et les matériaux à utiliser.', 'Il décrit les étapes importantes de sa démarche et explique un ajustement apporté à sa création.'],
      ['L’élève précise son intention visuelle en faisant des choix personnels dans ses créations plastiques.']
    ),
    art_plast_apprecier: makeCommentBankCategories(
      ['L’élève décrit les éléments visuels d’une œuvre à l’aide du vocabulaire des arts plastiques.', 'Il relie des aspects de l’image à l’effet produit pour expliquer son appréciation.', 'Il fait des liens entre une œuvre et des éléments de son contexte culturel abordés en classe.'],
      ['Il bénéficie de questions pour repérer les éléments visuels qui soutiennent son appréciation.', 'Il apprend à expliquer le lien entre un aspect de l’image et l’effet ressenti.', 'Il bénéficie de repères pour relier une œuvre à son contexte culturel.'],
      ['Il compare des images à partir d’éléments visuels précis avant de formuler son appréciation.', 'Il consulte les repères culturels présentés et les met en relation avec ce qui est visible dans l’œuvre.'],
      ['L’élève enrichit ses appréciations en s’appuyant sur des éléments visuels et culturels.']
    ),
    anglais: makeCommentBankCategories(
      ['L’élève utilise les mots et les expressions travaillés pour participer à des échanges en anglais.', 'Il montre sa compréhension de textes lus et entendus en réutilisant des informations dans une tâche.', 'Il écrit de courts textes en respectant le sujet, les modèles et les conventions linguistiques travaillées.'],
      ['Il bénéficie de modèles pour amorcer et poursuivre un échange en anglais.', 'Il apprend à sélectionner les informations utiles d’un texte lu ou entendu pour les réutiliser.', 'Il bénéficie de soutien pour organiser son texte en anglais et appliquer les conventions travaillées.'],
      ['Il utilise les expressions de dépannage apprises pour demander une précision en anglais.', 'Il consulte les modèles et les ressources proposés pour préparer et réviser son texte.'],
      ['L’élève élargit ses moyens de comprendre l’anglais et de l’utiliser dans les tâches proposées.']
    ),
    eps: makeCommentBankCategories(
      ['L’élève planifie des actions motrices et des stratégies qui tiennent compte de la situation.', 'Il coordonne ses actions avec celles de ses partenaires et applique les règles de sécurité.', 'Il met en pratique les principes travaillés pour réaliser des activités physiques et développer de saines habitudes de vie.'],
      ['Il bénéficie de soutien pour choisir des actions ou des stratégies adaptées aux contraintes de l’activité.', 'Il apprend à synchroniser ses actions avec celles des autres dans les jeux.', 'Il bénéficie de rappels pour appliquer les principes travaillés et les règles de sécurité.'],
      ['Il compare le déroulement de l’activité au plan prévu et propose un ajustement.', 'Il choisit une piste d’amélioration à partir de ses essais dans les activités physiques.'],
      ['L’élève améliore ses façons d’agir et de coopérer en réinvestissant les principes travaillés.']
    )
  },
  3: {
    ccq: makeCommentBankCategories(
      ['L’élève mobilise les connaissances pertinentes pour réfléchir aux réalités culturelles étudiées.', 'Il compare les points de vue en tenant compte des informations et des raisons qui les appuient.', 'Il développe une réponse claire et cohérente, appuyée sur des informations et des idées pertinentes.'],
      ['Il bénéficie de soutien pour établir des liens entre les connaissances et la réalité culturelle étudiée.', 'Il apprend à examiner les points de vue à partir des informations disponibles plutôt que de ses premières impressions.', 'Il bénéficie de questions pour formuler des constats clairs et développer une réponse suffisamment appuyée.'],
      ['Il organise les arguments et les informations issus de documents ou de situations fictives avant de formuler sa réponse.', 'Il vérifie la cohérence de ses constats et ajuste son explication à partir des informations recueillies.'],
      ['L’élève approfondit sa réflexion critique sur les réalités culturelles en confrontant les idées aux informations pertinentes.']
    ),
    sciences: makeCommentBankCategories(
      ['L’élève précise le problème scientifique ou technologique et formule une explication ou une solution provisoire pertinente.', 'Il conduit une démarche cohérente, ajuste ses essais et utilise les instruments de façon appropriée et sécuritaire.', 'Il construit une explication ou une solution en reliant ses résultats aux connaissances scientifiques et technologiques.'],
      ['Il bénéficie de questions pour préciser le problème et formuler une proposition qu’il peut mettre à l’essai.', 'Il apprend à choisir les instruments et les étapes qui permettent d’obtenir des observations utiles.', 'Il bénéficie de soutien pour appuyer son explication sur ses résultats et employer une terminologie précise.'],
      ['Il organise ses observations pour confronter son explication de départ aux résultats de ses essais.', 'Il explique les ajustements apportés à sa démarche et détermine ce qui pourrait être vérifié à nouveau.'],
      ['L’élève développe des explications et des solutions plus précises en mettant ses idées à l’épreuve.']
    ),
    social: makeCommentBankCategories(
      ['L’élève situe les sociétés et les événements étudiés dans le temps et dans l’espace à l’aide de repères précis.', 'Il met en relation des faits pour expliquer l’organisation d’une société et les caractéristiques de son territoire.', 'Il explique des changements et compare des sociétés en établissant des liens de causalité appuyés sur des faits.'],
      ['Il bénéficie de soutien pour mettre en relation plusieurs repères temporels et géographiques.', 'Il apprend à distinguer les faits pertinents pour expliquer l’organisation d’une société.', 'Il bénéficie de questions pour expliquer les causes et les conséquences d’un changement ou préciser une comparaison.'],
      ['Il croise les informations des documents proposés et conserve la trace des faits utiles à sa recherche.', 'Il vérifie ses repères sur des cartes et des lignes du temps avant de formuler une explication.'],
      ['L’élève approfondit sa compréhension des sociétés en expliquant les relations entre les faits, les changements et les territoires.']
    ),
    art_plast_creer: makeCommentBankCategories(
      ['L’élève combine les éléments du langage plastique pour donner une intention expressive à son image.', 'Il choisit et utilise les gestes transformateurs selon les matériaux et les effets recherchés.', 'Il organise l’espace et développe une réalisation personnelle en lien avec sa proposition de départ.'],
      ['Il bénéficie de soutien pour mettre ses choix visuels au service de son intention expressive.', 'Il apprend à ajuster ses gestes et ses outils pour produire les effets recherchés.', 'Il bénéficie de questions pour approfondir ses choix personnels et la cohérence de sa composition.'],
      ['Il met en relation les effets obtenus dans ses essais et les choix retenus pour son image.', 'Il porte un regard sur sa démarche et explique les ajustements qui ont fait évoluer sa réalisation.'],
      ['L’élève développe des créations plastiques personnelles dont les choix visuels soutiennent son intention.']
    ),
    art_plast_apprecier: makeCommentBankCategories(
      ['L’élève appuie son appréciation sur des aspects précis du langage plastique et de l’organisation de l’image.', 'Il explique les liens entre les choix visuels d’une œuvre et les effets ressentis.', 'Il met en relation les aspects d’une œuvre et les repères socioculturels abordés en classe.'],
      ['Il bénéficie de questions pour choisir les éléments visuels qui appuient son appréciation.', 'Il apprend à dépasser sa première impression en expliquant les effets des choix visuels.', 'Il bénéficie de soutien pour mettre les aspects d’une œuvre en relation avec son contexte socioculturel.'],
      ['Il compare des œuvres et utilise un vocabulaire précis pour justifier ses observations.', 'Il confronte sa première appréciation aux éléments visuels et aux repères culturels étudiés.'],
      ['L’élève formule des appréciations plus précises en reliant les aspects visuels, les effets et le contexte des œuvres.']
    ),
    anglais: makeCommentBankCategories(
      ['L’élève amorce et maintient des échanges en anglais en combinant les expressions apprises pour transmettre un message personnel.', 'Il sélectionne et organise les informations de textes lus et entendus pour produire une réponse personnalisée.', 'Il rédige des textes en anglais qui tiennent compte de l’intention et du destinataire et respectent les conventions linguistiques travaillées.'],
      ['Il bénéficie de rétroactions pour préciser ses messages et poursuivre les échanges en anglais.', 'Il apprend à choisir les informations pertinentes et à les organiser dans sa production de réinvestissement.', 'Il bénéficie de soutien pour structurer son texte en anglais et appliquer les règles linguistiques ciblées.'],
      ['Il recourt aux stratégies de dépannage pour maintenir l’échange en anglais et clarifier son message.', 'Il révise son texte en vérifiant les caractéristiques attendues et les conventions linguistiques travaillées.'],
      ['L’élève développe des communications plus personnelles et plus structurées en anglais.']
    ),
    eps: makeCommentBankCategories(
      ['L’élève élabore des plans d’action qui tiennent compte des contraintes de l’activité et de ses possibilités.', 'Il applique les principes d’action, de synchronisation et de communication dans les jeux en respectant les règles de sécurité.', 'Il met en œuvre un plan de pratique régulière et sécuritaire en lien avec les habitudes de vie travaillées.'],
      ['Il bénéficie de soutien pour prévoir des actions et des stratégies adaptées à la situation.', 'Il apprend à ajuster ses actions à celles des autres et aux changements dans le jeu.', 'Il bénéficie de repères pour mettre en œuvre son plan de pratique et appliquer les principes travaillés.'],
      ['Il évalue l’effet de ses choix sur le déroulement de l’activité et propose des ajustements précis.', 'Il compare les résultats de ses essais aux moyens prévus dans son plan pour choisir une piste d’amélioration.'],
      ['L’élève consolide ses moyens d’agir, de coopérer et de pratiquer des activités physiques de façon sécuritaire.']
    )
  }
};

function getPrimaryCommentSubjectKey(subject) {
  const id = subject && subject.id || '';
  const group = subject && subject.group || '';
  if (id === 'ccq_global' || group === 'ccq') return 'ccq';
  if (group === 'sciences' || /^sciences_/.test(id)) return 'sciences';
  if (group === 'social' || ['univers_social', 'us_changement', 'us_diversite'].includes(id)) return 'social';
  if (group === 'art_plast' || /^art_plast_/.test(id)) return id === 'art_plast_c3' ? 'art_plast_apprecier' : 'art_plast_creer';
  if (group === 'anglais' || /^ang(?:lais)?_/.test(id)) return 'anglais';
  if (group === 'eps' || /^(?:eps|educ_phys)_/.test(id)) return 'eps';
  return id;
}
