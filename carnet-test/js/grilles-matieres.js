    function observableCriterion(id, title, levels, options = {}) {
      return {
        id,
        title,
        formativeOnly: options.formativeOnly === true,
        cells: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map(level => [level, [levels[level]]]))
      };
    }

    // 3e CYCLE (5e et 6e année)
    const ALL_SUBJECTS_CONFIG = [];