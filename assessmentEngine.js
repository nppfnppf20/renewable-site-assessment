(function () {
  const state = {
    facts: { alc: null, flood: null, renewables: null, layers: null }
  };

  function setFacts(partial) {
    if (!partial || typeof partial !== 'object') return;
    state.facts = { ...state.facts, ...partial };
  }

  function buildAlcSection(alc) {
    if (!alc || !Array.isArray(alc.by_grade)) {
      return '<p><strong>Agricultural land:</strong> Data unavailable. Please run analysis first.</p>';
    }
    const norm = (v) => String(v ?? '').toLowerCase();
    const hasHigh = alc.by_grade.some(g => {
      const label = norm(g.grade);
      const area = Number(g.area_ha) > 0;
      return area && (label.includes('1') || label.includes('2') || label.includes('3'));
    });
    const hasLow = alc.by_grade.some(g => {
      const label = norm(g.grade);
      const area = Number(g.area_ha) > 0;
      return area && (label.includes('4') || label.includes('5') || label.includes('urban'));
    });
    let out = '';
    if (hasHigh) {
      out += '<p><strong>Agricultural land:</strong> Grades 1/2/3 present on site. This presents a medium risk.</p>';
    } else if (hasLow) {
      out += '<p><strong>Agricultural land:</strong> Grades 4/5/Urban present on site. This presents low-risk.</p>';
    } else {
      out += '<p><strong>Agricultural land:</strong> No mapped ALC grades detected on site.</p>';
    }
    out += '<p><em>Recommended Surveys:</em> Agricultural Land Classification Survey.</p>';
    return out;
  }

  function buildAssessment() {
    const alc = state.facts.alc;
    const sections = [];
    sections.push(buildAlcSection(alc));
    return `<div>${sections.join('')}</div>`;
  }

  window.assessmentEngine = { setFacts, buildAssessment };
})();

