    function extractStudentFirstName(studentOrName) {
      if (!studentOrName) return 'L’élève';
      if (typeof studentOrName === 'object') {
        const fn = String(studentOrName.firstName || '').trim();
        if (fn) return fn;
        const full = String(studentOrName.name || '').trim();
        return full ? full.split(/\s+/)[0] : 'L’élève';
      }
      const str = String(studentOrName).trim();
      return str ? str.split(/\s+/)[0] : 'L’élève';
    }

    function startsWithFrenchVowelOrH(word) {
      return /^[aeiouyàâäéèêëîïôöùûüÿhAEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜŸH]/.test(String(word || '').trim());
    }

    const FEMININE_AGREEMENTS = [
      ['compris', 'comprise'], ['conscient', 'consciente'], ['guidé', 'guidée'], ['soutenu', 'soutenue'],
      ['encouragé', 'encouragée'], ['accompagné', 'accompagnée'], ['amené', 'amenée'], ['appelé', 'appelée'],
      ['seul', 'seule'], ['certain', 'certaine'], ['habitué', 'habituée'], ['engagé', 'engagée'],
      ['sollicité', 'sollicitée'], ['centré', 'centrée'],
      ['attentif', 'attentive'], ['actif', 'active'], ['fier', 'fière'], ['de lui-même', 'd’elle-même'], ['lui-même', 'elle-même'],
      // « lui » après une préposition désigne l’élève (« pour lui » → « pour elle »); « il lui permet » reste inchangé.
      ['autour de lui', 'autour d’elle'], ['pour lui', 'pour elle'], ['avec lui', 'avec elle'], ['chez lui', 'chez elle'], ['sur lui', 'sur elle']
    ];

    function applyFeminineAgreements(sentence) {
      // \b ignore les lettres accentuées : on délimite les mots avec \p{L} pour accorder « encouragé », etc.
      return FEMININE_AGREEMENTS.reduce((text, [masc, fem]) => {
        const pattern = `[${masc[0]}${masc[0].toUpperCase()}]${masc.slice(1)}`;
        return text.replace(new RegExp(`(?<![\\p{L}-])${pattern}(?![\\p{L}-])`, 'gu'),
          match => (match[0] === masc[0] ? fem : fem[0].toUpperCase() + fem.slice(1)));
      }, String(sentence || ''));
    }

    function personalizeSingleSentence(rawText, firstName, pron, useNameOnFirstSubject, allowName = true) {
      const cap = word => word.charAt(0).toUpperCase() + word.slice(1);
      const isFem = pron === 'elle';
      let s = String(rawText || '').trim();
      if (!s) return '';

      // Les « il » impersonnels (« il faut », « s’il y a lieu »…) ne désignent pas l’élève.
      const impersonal = [];
      s = s.replace(/\b([Ss][’']il|[Ii]l)(?= (?:y a|faut|s[’']agit|est (?:important|nécessaire|souhaitable|recommandé) de))/g, match => {
        impersonal.push(match);
        return `\u0000${impersonal.length - 1}\u0000`;
      });
      let nameUsed = !useNameOnFirstSubject;
      const getSubj = (capitalize) => {
        if (!nameUsed) {
          nameUsed = true;
          return firstName;
        }
        return capitalize ? cap(pron) : pron;
      };

      // 0. « l’élève » complément (« de l’élève », « par l’élève ») : jamais remplacé par « il »/« elle ».
      if (allowName && firstName !== 'L’élève') {
        s = s.replace(/\b([Dd])e l[’']élève\b/g, (match, d) =>
          startsWithFrenchVowelOrH(firstName) ? `${d}’${firstName}` : `${d}e ${firstName}`);
        s = s.replace(/(?<!\p{L})(par|pour|avec|chez|selon|envers|à) l[’']élève\b/gu, (match, prep) => `${prep} ${firstName}`);
      } else {
        s = s.replace(/(?<!\p{L})(de|par|pour|avec|chez|selon|envers|à) l([’'])élève\b/gu, (match, prep, apos) => `${prep} l${apos}\u0001`);
      }

      // 1. Sujets explicites "L'élève" / "l'élève"
      s = s.replace(/\bL[’']élève\b/g, () => getSubj(true));
      s = s.replace(/\bl[’']élève\b/g, () => getSubj(false));
      s = s.replace(/\u0001/g, 'élève');

      // 2. Élisions en début de proposition ("Lorsqu'il", "Qu'il", "S'il")
      s = s.replace(/\b(Lorsqu|lorsqu)[’']il\b/g, (match, prefix) => {
        const isCap = prefix.charAt(0) === 'L';
        if (!nameUsed) {
          nameUsed = true;
          return startsWithFrenchVowelOrH(firstName)
            ? `${isCap ? 'Lorsqu’' : 'lorsqu’'}${firstName}`
            : `${isCap ? 'Lorsque ' : 'lorsque '}${firstName}`;
        }
        return `${isCap ? 'Lorsqu’' : 'lorsqu’'}${pron}`;
      });

      s = s.replace(/\b(Qu|qu)[’']il\b/g, (match, prefix) => {
        const isCap = prefix.charAt(0) === 'Q';
        if (!nameUsed) {
          nameUsed = true;
          return startsWithFrenchVowelOrH(firstName)
            ? `${isCap ? 'Qu’' : 'qu’'}${firstName}`
            : `${isCap ? 'Que ' : 'que '}${firstName}`;
        }
        return `${isCap ? 'Qu’' : 'qu’'}${pron}`;
      });

      s = s.replace(/\b(S|s)[’']il\b/g, (match, prefix) => {
        const isCap = prefix.charAt(0) === 'S';
        if (!nameUsed) {
          nameUsed = true;
          return `${isCap ? 'Si ' : 'si '}${firstName}`;
        }
        return isFem ? `${isCap ? 'Si ' : 'si '}elle` : `${isCap ? 'S’' : 's’'}il`;
      });

      // 3. Pronoms "Il" en début de phrase et "il" en cours de phrase
      // Attention : si le prénom vient déjà d'être utilisé dans la même phrase (ex. "Lorsque Maxime..., il..."),
      // tous les "il" suivants restent "il" ou "elle" !
      s = s.replace(/\bIl\b/g, () => getSubj(true));
      s = s.replace(/\bil\b/g, () => getSubj(false));

      if (isFem) {
        s = applyFeminineAgreements(s);
      }
      return s.replace(/\u0000(\d+)\u0000/g, (match, i) => impersonal[Number(i)]);
    }

    function personalizeScaleSentences(sentencesArray, studentOrName, mode = 'prenom') {
      const firstName = extractStudentFirstName(studentOrName);
      const isFem = mode === 'elle' || mode === 'prenom_elle';
      const pron = isFem ? 'elle' : 'il';
      const useFirstNameInOpening = (mode === 'prenom' || mode === 'prenom_elle');

      return (sentencesArray || []).map((raw, idx) => {
        const useNameHere = useFirstNameInOpening && idx === 0;
        let transformed = personalizeSingleSentence(raw, firstName, pron, useNameHere, useFirstNameInOpening);
        // Ajouter un connecteur léger à la 3e phrase si plusieurs phrases commencent par Il/Elle de façon répétitive
        if (idx === 2 && (sentencesArray.length >= 3) && /^(Il|Elle)\s+[a-zàâäéèêëîïôöùûüÿç]/.test(transformed)) {
          transformed = 'De plus, ' + transformed.charAt(0).toLowerCase() + transformed.slice(1);
        }
        return transformed;
      }).filter(Boolean).join(' ');
    }

    function personalizeSentence(text, name, mode) {
      return personalizeScaleSentences([text], name, mode);
    }

    function generateCompetencyComment(student, scale, picked) {
      const model = getCompetencyScaleModel(scale);
      const mode = student.pronoun || 'prenom';
      const entries = Object.keys(picked || {}).map(rowKey => {
        const level = model.levels.find(l => l.n === Number(picked[rowKey]));
        const sentence = level && level.sentences.find(s => s.row === rowKey);
        const [e, j] = rowKey.split(':').map(Number);
        return sentence ? { e, j, text: sentence.text } : null;
      }).filter(Boolean).sort((a, b) => a.e - b.e || a.j - b.j);
      return personalizeScaleSentences(entries.map(item => item.text), student, mode);
    }

    // Banque de commentaires professionnels alignés PFEQ (utilisent le gabarit "L'élève" / "il" transformé sans répétition)
    const COMMENT_BANK_CATEGORIES = [
      {
        id: 'forces',
        label: 'Forces & Acquis',
        phrases: [
          'L’élève démontre une solide compréhension des notions travaillées durant l’étape.',
          'Il mobilise avec justesse et autonomie les concepts et processus attendus.',
          'L’élève s’investit activement dans les tâches proposées et fournit un travail soigné.',
          'Il repère efficacement les informations importantes et applique les stratégies enseignées.',
          'Ses traces sont claires, structurées et témoignent d’un raisonnement rigoureux.',
          'L’élève communique ses idées avec précision et respecte les consignes de la tâche.',
          'Il progresse de façon constante et réinvestit bien les rétroactions reçues en classe.'
        ]
      },
      {
        id: 'defis',
        label: 'Défis & Consolidation',
        phrases: [
          'Certaines notions de l’étape demeurent en voie de consolidation et gagnent à être retravaillées.',
          'Il bénéficie d’une relance ponctuelle pour dégager les éléments essentiels d’une consigne complexe.',
          'Il est encouragé à prendre le temps de relire et de vérifier sa démarche afin d’éviter les oublis.',
          'La structuration des étapes de sa démarche demeure un objectif prioritaire pour la prochaine étape.',
          'Lorsqu’il fait face à une tâche nouvelle, il a encore besoin d’un soutien ciblé pour amorcer son travail.',
          'Une attention plus soutenue lors de la révision lui permettra d’améliorer la précision de ses réponses.'
        ]
      },
      {
        id: 'strategies',
        label: 'Stratégies, Outils & Autonomie',
        phrases: [
          'Il utilise judicieusement ses référentiels et ses outils d’aide pour soutenir sa réussite.',
          'L’utilisation régulière de ses outils d’adaptation soutient efficacement son autonomie.',
          'Il gagne à consulter plus spontanément ses aide-mémoires avant de solliciter l’aide de l’adulte.',
          'Le fractionnement de la tâche en sous-étapes l’aide à maintenir sa concentration jusqu’à la fin.',
          'Il développe graduellement sa capacité à s’autoréguler et à demander de l’aide au moment opportun.'
        ]
      },
      {
        id: 'bilan',
        label: 'Bilan & Encouragement',
        phrases: [
          'Bravo pour les efforts soutenus et la belle persévérance tout au long de l’étape.',
          'Les progrès observés sont encourageants; il faut poursuivre dans cette voie.',
          'Sa participation positive et son attitude engagée contribuent grandement à ses apprentissages.',
          'En poursuivant ses efforts et en appliquant ses stratégies de vérification, il consolidera ses acquis.'
        ]
      }
    ];

    function synthesizeStudentSubjectComment(termId, subjectId, studentId, modeOverride) {
      const st = appState.students.find(s => s.id === studentId);
      const sub = SUBJECTS_CONFIG.find(s => s.id === subjectId) || getCurrentSubjectConfig();
      if (!st || !sub) return '';
      const mode = modeOverride || st.pronoun || 'prenom';
      const termData = appState.terms[termId];
      const subData = termData && termData.subjectData[sub.id];
      const rec = subData && subData.studentRecords[st.id];
      const summary = computeStudentSubjectSummary(termId, sub.id, st.id);
      const sentences = [];

      // 1. Phrase d'ouverture selon le portrait global / niveau de maîtrise
      const pct = summary.finalPct;
      const partName = (sub.partLabel || sub.shortName || 'cette compétence').toLowerCase();
      if (pct !== null) {
        if (pct >= 85) {
          sentences.push(`En ${partName}, l’élève démontre une maîtrise assurée et constante des attentes de l’étape (${pct} %).`);
        } else if (pct >= 75) {
          sentences.push(`En ${partName}, l’élève répond bien aux attentes de l’étape et mobilise adéquatement les notions travaillées (${pct} %).`);
        } else if (pct >= 60) {
          sentences.push(`En ${partName}, l’élève satisfait aux exigences de base de l’étape (${pct} %), bien que certains acquis demeurent à consolider.`);
        } else {
          sentences.push(`En ${partName}, l’élève éprouve encore des difficultés marquées par rapport aux attentes de l’étape (${pct} %) et nécessite un accompagnement soutenu.`);
        }
      } else {
        sentences.push(`En ${partName}, l’élève participe aux activités d’apprentissage proposées en classe.`);
      }

      // 2. Observations issues du barème école ou des traces observables
      if (rec) {
        const checkedBareme = Array.isArray(rec.baremeChecked) ? rec.baremeChecked : [];
        const hasAutonomieA = checkedBareme.some(k => k.startsWith('execution_A') || k.startsWith('execution_B'));
        const hasAutonomieC = checkedBareme.some(k => k.startsWith('execution_C'));
        const hasAutonomieDE = checkedBareme.some(k => k.startsWith('execution_D') || k.startsWith('execution_E'));

        if (hasAutonomieA) {
          sentences.push('Il réalise les tâches avec autonomie et applique efficacement les stratégies enseignées.');
        } else if (hasAutonomieC) {
          sentences.push('Il réussit l’essentiel des tâches courantes avec une relance ponctuelle ou l’appui de ses référentiels.');
        } else if (hasAutonomieDE) {
          sentences.push('Il a besoin d’un guidage étape par étape pour organiser sa démarche et mener ses travaux à terme.');
        }

        // Vérifier les indicateurs PIA ou marqueurs rapides fréquents
        const flagsUsed = new Set();
        if (rec.scoreMeta) {
          Object.values(rec.scoreMeta).forEach(m => {
            if (m && Array.isArray(m.flags)) m.flags.forEach(f => flagsUsed.add(f));
          });
        }
        if (flagsUsed.has('AIDE') && !hasAutonomieDE) {
          sentences.push('Un soutien ciblé en cours de tâche l’aide à sécuriser ses étapes de réalisation.');
        } else if (flagsUsed.has('T+')) {
          sentences.push('L’octroi de temps supplémentaire lui permet de démontrer pleinement ses compétences.');
        } else if (Array.isArray(st.adaptations) && st.adaptations.length > 0 && sentences.length < 3) {
          sentences.push('Il gagne à recourir systématiquement à ses outils d’aide lors de ses productions et de sa révision.');
        }
      }

      // 3. Phrase de clôture constructive si seulement 1 phrase
      if (sentences.length === 1) {
        if (pct !== null && pct >= 75) {
          sentences.push('Il maintient un engagement positif et fournit un travail soigné.');
        } else {
          sentences.push('En poursuivant ses efforts et en vérifiant attentivement son travail, il consolidera ses apprentissages.');
        }
      }

      return personalizeScaleSentences(sentences, st, mode);
    }

    function getCompetencyComment(student, term, scale, picked) {
      const stored = student.competencyComments && student.competencyComments[term] && student.competencyComments[term][scale.id];
      if (typeof stored === 'string' && stored.trim()) return { text: stored, custom: true };
      return { text: generateCompetencyComment(student, scale, picked), custom: false };
    }

    function setCompetencyComment(student, term, scaleId, text) {
      if (!student.competencyComments) student.competencyComments = {};
      if (!student.competencyComments[term]) student.competencyComments[term] = {};
      if (text && text.trim()) student.competencyComments[term][scaleId] = text;
      else delete student.competencyComments[term][scaleId];
    }

