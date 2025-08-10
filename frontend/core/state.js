const state = {
  facts: { alc: null, flood: null, renewables: null, layers: null },
  subscribers: new Set()
};

export function setFacts(partial) {
  state.facts = { ...state.facts, ...partial };
  state.subscribers.forEach((fn) => {
    try { fn({ ...state.facts }); } catch (_) {}
  });
}

export function getFacts() {
  return { ...state.facts };
}

export function subscribe(listener) {
  state.subscribers.add(listener);
  return () => state.subscribers.delete(listener);
}

