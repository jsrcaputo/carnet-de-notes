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
      ['sollicité', 'sollicitée'], ['centré', 'centrée'], ['initié', 'initiée'],
      ['attentif', 'attentive'], ['actif', 'active'], ['fier', 'fière'], ['de lui-même', 'd’elle-même'], ['lui-même', 'elle-même'],
      // « lui » après une préposition désigne l’élève (« pour lui » → « pour elle »); « il lui permet » reste inchangé.
      ['autour de lui', 'autour d’elle'], ['pour lui', 'pour elle'], ['avec lui', 'avec elle'], ['chez lui', 'chez elle'], ['sur lui', 'sur elle']
    ];
    const FEMININE_ATTRIBUTES = new RegExp(`(?<![\\p{L}-])(?:${FEMININE_AGREEMENTS.filter(([m]) => !m.includes('lui')).map(([, f]) => f).join('|')})(?:\\s*,|\\s+et|\\s+ou)\\s+$`, 'iu');

    function applyFeminineAgreements(sentence) {
      // Deux passes : une coordination peut précéder l’attribut qui la déclenche.
      return applyFeminineAgreementsOnce(applyFeminineAgreementsOnce(sentence));
    }

    function applyFeminineAgreementsOnce(sentence) {
      return FEMININE_AGREEMENTS.reduce((text, [masc, fem]) => {
        const pattern = `[${masc[0]}${masc[0].toUpperCase()}]${masc.slice(1)}`;
        return text.replace(new RegExp(`(?<![\\p{L}-])${pattern}(?![\\p{L}-])`, 'gu'),
          (match, offset) => {
            // Les adjectifs ne doivent pas accorder un autre nom (« un soutien soutenu »).
            if (!masc.includes('lui')) {
              const before = text.slice(0, offset);
              const attribut = /(?:^|[^\p{L}-])(?:est|était|sera|serait|soit|être|été|semble|reste|demeure|devient|montre|sent|paraît)(?:\s+(?:pas|plus|moins|très|bien|souvent|encore|déjà|un peu|surtout|parfois|aussi|davantage))*\s+$/iu.test(before);
              const apposition = /^(?:(?:déjà|de plus en plus|souvent|parfois|très|un peu)\s+)*$/iu.test(before);
              // Coordination avec un attribut déjà accordé (« attentive et fier » → « attentive et fière »).
              const coordination = FEMININE_ATTRIBUTES.test(before);
              if (!attribut && !apposition && !coordination) return match;
            }
            return match[0] === masc[0] ? fem : fem[0].toUpperCase() + fem.slice(1);
          });
      }, String(sentence || ''));
    }

    function personalizeSingleSentence(rawText, firstName, pron, useNameOnFirstSubject, allowName = true) {
      const cap = word => word.charAt(0).toUpperCase() + word.slice(1);
      const isFem = pron === 'elle';
      let s = String(rawText || '').trim();
      if (!s) return '';

      // Corrections des coquilles des textes officiels, sans modifier ceux-ci.
      s = s.replace(/(?<![\p{L}-])situation-problèmes(?![\p{L}-])/gu, 'situations-problèmes')
        .replace(/(?<=[\p{L})])[ \t\u00a0]*:(?!\/)/gu, '\u00a0:')
        .replace(/pour ce faire un vocabulaire/g, 'pour ce faire, un vocabulaire')
        .replace(/afin qu[’']on puisse le lire facilement/g, 'afin que son écriture soit facile à lire')
        .replace(/et s[’']il y a lieu, son registre/g, 'et, s’il y a lieu, son registre');

      let nameUsed = !useNameOnFirstSubject || !allowName;
      const subject = capitalize => {
        if (!nameUsed) {
          nameUsed = true;
          return firstName;
        }
        return capitalize ? cap(pron) : pron;
      };
      // Une seule passe conserve l’ordre des sujets et évite de placer le prénom
      // dans une subordonnée avant un pronom qui désigne déjà l’élève.
      const tokens = /(?<![\p{L}-])([Ss][’']il|[Ii]l)(?=\s+(?:y a|faut|lui arrive|s[’']agit|est\s+(?:important|nécessaire|souhaitable|recommandé)\s+de))|(?<![\p{L}-])(?:[Dd]e|[Pp]ar|[Pp]our|[Aa]vec|[Cc]hez|[Ss]elon|[Ee]nvers|[Àà])\s+l[’']élève(?![\p{L}-])|(?<![\p{L}-])(?:[Ll]orsque|[Qq]ue|[Ss]i)\s+l[’']élève(?![\p{L}-])|(?<![\p{L}-])(?:[Ll]orsqu|[Qq]u|[Ss])[’']il(?![\p{L}-])|(?<![\p{L}-])[Ll][’']élève(?![\p{L}-])|(?<![\p{L}-])[Ii]l(?![\p{L}-])/gu;
      s = s.replace(tokens, (match, impersonal) => {
        if (impersonal) return match;
        const complement = /^(de|par|pour|avec|chez|selon|envers|à)\s+l[’']élève$/iu.exec(match);
        if (complement) {
          if (nameUsed || firstName === 'L’élève') return match;
          nameUsed = true;
          const prep = complement[1];
          return prep.toLowerCase() === 'de' && startsWithFrenchVowelOrH(firstName)
            ? `${prep[0]}’${firstName}` : `${prep} ${firstName}`;
        }
        const conjunction = /^([\p{L}]+)\s+l[’']élève$/u.exec(match);
        if (conjunction) {
          const prefix = conjunction[1];
          const value = subject(false);
          return prefix.toLowerCase() !== 'si' && startsWithFrenchVowelOrH(value)
            ? `${prefix.slice(0, -1)}’${value}` : `${prefix} ${value}`;
        }
        const elision = /^([\p{L}]+)[’']il$/u.exec(match);
        if (elision) {
          const prefix = elision[1];
          const isCap = prefix[0] === prefix[0].toUpperCase();
          const value = subject(false);
          if (prefix.toLowerCase() === 's') {
            return value === 'il' ? `${isCap ? 'S’' : 's’'}il` : `${isCap ? 'Si ' : 'si '}${value}`;
          }
          const full = prefix.toLowerCase() === 'qu' ? 'que' : 'lorsque';
          const base = isCap ? cap(full) : full;
          return startsWithFrenchVowelOrH(value) ? `${base.slice(0, -1)}’${value}` : `${base} ${value}`;
        }
        return subject(match[0] === match[0].toUpperCase());
      });

      return isFem ? applyFeminineAgreements(s) : s;
    }

    function personalizeScaleSentences(sentencesArray, studentOrName, mode = 'prenom') {
      const firstName = extractStudentFirstName(studentOrName);
      const isFem = mode === 'elle' || mode === 'prenom_elle';
      const pron = isFem ? 'elle' : 'il';
      const useFirstNameInOpening = (mode === 'prenom' || mode === 'prenom_elle');

      return (sentencesArray || []).map((raw, idx) => {
        const useNameHere = useFirstNameInOpening && idx === 0;
        return personalizeSingleSentence(raw, firstName, pron, useNameHere, useFirstNameInOpening);
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
        const [e, j] = rowKey.replace(/^v2:/, '').split(':').map(Number);
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

    function synthesizePreschoolSubjectComment(termId, subject, student, mode) {
      const term = appState.terms[termId];
      const data = term && term.subjectData[subject.id];
      const record = data && data.studentRecords[student.id];
      const observationIndices = PRESCHOOL_SYNTHESIS_OBSERVATIONS[subject.id];
      if (!record || !observationIndices) return '';
      const latestByCriterion = new Map();
      const assignments = (data.assignments || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      assignments.forEach(assignment => {
        if (!isAssignmentForStudent(assignment, student)) return;
        const meta = record.scoreMeta && record.scoreMeta[assignment.id];
        if (!meta || meta.notEvaluated || meta.linkedCopy || !Array.isArray(meta.checked)) return;
        meta.checked.forEach(key => {
          const match = /^(presco_c[1-5])_([1-3])_([A-E])_\d+$/.exec(key);
          if (!match || match[1] !== subject.id || latestByCriterion.has(match[2])) return;
          latestByCriterion.set(match[2], match[3]);
        });
      });
      // Les traces soutiennent le commentaire, sans constituer un constat global ni un bilan officiel.
      const sentences = Array.from(latestByCriterion).sort((a, b) => Number(a[0]) - Number(b[0])).map(([criterion, family]) => {
        const pair = PRESCHOOL_COMMENT_OBSERVATIONS[subject.id][observationIndices[Number(criterion) - 1]];
        return pair[['D', 'E'].includes(family) ? 1 : 0];
      });
      return personalizeScaleSentences(sentences, student, mode);
    }

    function synthesizeStudentSubjectComment(termId, subjectId, studentId, modeOverride) {
      const st = appState.students.find(s => s.id === studentId);
      const sub = SUBJECTS_CONFIG.find(s => s.id === subjectId) || getCurrentSubjectConfig();
      if (!st || !sub) return '';
      const mode = modeOverride || st.pronoun || 'prenom';
      if (getStudentCycle(st.gradeLevel) === 'P') return synthesizePreschoolSubjectComment(termId, sub, st, mode);
      if (getStudentCycle(st.gradeLevel) === 1 && ['sciences', 'social'].includes(getPrimaryCommentSubjectKey(sub))) return '';
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
        const hasSupportFlag = flagsUsed.has('AIDE') || flagsUsed.has('AIDE+') || flagsUsed.has('AIDE1');
        if (hasSupportFlag && !hasAutonomieDE) {
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

