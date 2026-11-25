    const MUSIC_COMMENT_BANKS = {
      1: {
        musique_c1c2: makeCommentBankCategories(
          ['L’élève explore des sons et organise de courts motifs dans sa création.', 'Il utilise les gestes vocaux ou instrumentaux travaillés et suit les signaux de jeu.'],
          ['Il apprend à organiser les sons pour exprimer son idée musicale.', 'Il bénéficie de repères pour ajuster ses gestes et suivre les signaux de la pièce.'],
          ['Il essaie différents sons avant de choisir ceux qui conviennent à son idée.', 'Il reprend un court passage en écoutant les autres et en observant les signaux.'],
          ['L’élève développe ses moyens d’inventer et d’interpréter de courtes pièces musicales.']
        ),
        musique_c3: makeCommentBankCategories(
          ['L’élève reconnaît des sons et des contrastes dans les pièces entendues.', 'Il relie une impression à un élément musical et utilise des mots appris en classe.'],
          ['Il bénéficie de questions pour repérer les éléments musicaux entendus.', 'Il apprend à expliquer son impression à partir d’un son ou d’un contraste.'],
          ['Il réécoute un court extrait et nomme ce qu’il entend avant de donner son appréciation.'],
          ['L’élève enrichit sa façon d’écouter et de parler de la musique.']
        )
      },
      2: {
        musique_c1c2: makeCommentBankCategories(
          ['L’élève choisit des éléments du langage musical et des procédés pour organiser sa pièce.', 'Il applique les techniques travaillées et tient compte des indications et des autres musiciens.'],
          ['Il apprend à relier ses choix musicaux à son intention.', 'Il bénéficie de repères pour ajuster sa technique et respecter les indications de la pièce.'],
          ['Il compare plusieurs essais de motifs avant de retenir ceux qui servent son intention.', 'Il reprend un passage en portant attention aux nuances et aux signaux.'],
          ['L’élève précise ses choix dans ses créations et ses interprétations musicales.']
        ),
        musique_c3: makeCommentBankCategories(
          ['L’élève décrit des éléments musicaux entendus et les relie aux effets ressentis.', 'Il utilise le vocabulaire musical et établit des liens avec les repères culturels étudiés.'],
          ['Il apprend à appuyer son appréciation sur des éléments précis de l’œuvre.', 'Il bénéficie de repères pour relier l’œuvre à un contexte culturel étudié.'],
          ['Il compare deux extraits à partir d’éléments musicaux précis et explique ses impressions.'],
          ['L’élève formule des appréciations en s’appuyant sur son écoute et les repères étudiés.']
        )
      },
      3: {
        musique_c1c2: makeCommentBankCategories(
          ['L’élève organise des phrases musicales et des procédés de composition en fonction de son intention.', 'Il ajuste sa technique, son expression et son jeu à la pièce et à l’ensemble.'],
          ['Il apprend à raffiner l’organisation musicale pour soutenir son intention.', 'Il bénéficie de rétroactions pour ajuster sa technique et les caractéristiques expressives de son interprétation.'],
          ['Il compare les effets de ses choix et révise l’organisation de sa pièce.', 'Il analyse un passage et ajuste son interprétation à partir des indications et de l’écoute des autres.'],
          ['L’élève développe des créations et des interprétations musicales cohérentes et expressives.']
        ),
        musique_c3: makeCommentBankCategories(
          ['L’élève justifie son appréciation par des éléments musicaux et les effets qu’ils produisent.', 'Il met en relation l’œuvre et des repères socioculturels à l’aide du vocabulaire approprié.'],
          ['Il apprend à choisir des exemples musicaux pertinents pour justifier son appréciation.', 'Il bénéficie de soutien pour préciser les liens entre l’œuvre, ses effets et son contexte.'],
          ['Il confronte sa première impression aux éléments entendus et aux repères culturels étudiés.'],
          ['L’élève affine ses appréciations en reliant les éléments musicaux, les effets et le contexte.']
        )
      }
    };
    [1, 2, 3].forEach(cycle => Object.assign(PRIMARY_SUBJECT_COMMENT_BANKS[cycle], MUSIC_COMMENT_BANKS[cycle]));
