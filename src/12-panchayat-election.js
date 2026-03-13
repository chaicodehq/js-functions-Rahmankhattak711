/**
 * 🗳️ Panchayat Election System - Capstone
 *
 * Village ki panchayat election ka system bana! Yeh CAPSTONE challenge hai
 * jisme saare function concepts ek saath use honge:
 * closures, callbacks, HOF, factory, recursion, pure functions.
 *
 * Functions:
 *
 *   1. createElection(candidates)
 *      - CLOSURE: private state (votes object, registered voters set)
 *      - candidates: array of { id, name, party }
 *      - Returns object with methods:
 *
 *      registerVoter(voter)
 *        - voter: { id, name, age }
 *        - Add to private registered set. Return true.
 *        - Agar already registered or voter invalid, return false.
 *        - Agar age < 18, return false.
 *
 *      castVote(voterId, candidateId, onSuccess, onError)
 *        - CALLBACKS: call onSuccess or onError based on result
 *        - Validate: voter registered? candidate exists? already voted?
 *        - If valid: record vote, call onSuccess({ voterId, candidateId })
 *        - If invalid: call onError("reason string")
 *        - Return the callback's return value
 *
 *      getResults(sortFn)
 *        - HOF: takes optional sort comparator function
 *        - Returns array of { id, name, party, votes: count }
 *        - If sortFn provided, sort results using it
 *        - Default (no sortFn): sort by votes descending
 *
 *      getWinner()
 *        - Returns candidate object with most votes
 *        - If tie, return first candidate among tied ones
 *        - If no votes cast, return null
 *
 *   2. createVoteValidator(rules)
 *      - FACTORY: returns a validation function
 *      - rules: { minAge: 18, requiredFields: ["id", "name", "age"] }
 *      - Returned function takes a voter object and returns { valid, reason }
 *
 *   3. countVotesInRegions(regionTree)
 *      - RECURSION: count total votes in nested region structure
 *      - regionTree: { name, votes: number, subRegions: [...] }
 *      - Sum votes from this region + all subRegions (recursively)
 *      - Agar regionTree null/invalid, return 0
 *
 *   4. tallyPure(currentTally, candidateId)
 *      - PURE FUNCTION: returns NEW tally object with incremented count
 *      - currentTally: { "cand1": 5, "cand2": 3, ... }
 *      - Return new object where candidateId count is incremented by 1
 *      - MUST NOT modify currentTally
 *      - If candidateId not in tally, add it with count 1
 *
 * @example
 *   const election = createElection([
 *     { id: "C1", name: "Sarpanch Ram", party: "Janata" },
 *     { id: "C2", name: "Pradhan Sita", party: "Lok" }
 *   ]);
 *   election.registerVoter({ id: "V1", name: "Mohan", age: 25 });
 *   election.castVote("V1", "C1", r => "voted!", e => "error: " + e);
 *   // => "voted!"
 */
export function createElection(candidates) {
  const candidateList = Array.isArray(candidates) ? candidates : [];
  const registered = new Set();
  const voted = new Set();
  const votes = {};
  for (const c of candidateList) {
    votes[c.id] = 0;
  }

  function registerVoter(voter) {
    if (!voter || typeof voter !== "object") return false;
    const { id, name, age } = voter;
    if (!id || !name || !Number.isFinite(age)) return false;
    if (age < 18) return false;
    if (registered.has(id)) return false;
    registered.add(id);
    return true;
  }

  function castVote(voterId, candidateId, onSuccess, onError) {
    const candidateExists = candidateList.some((c) => c.id === candidateId);
    if (!registered.has(voterId))
      return typeof onError === "function"
        ? onError("voter not registered")
        : null;
    if (!candidateExists)
      return typeof onError === "function"
        ? onError("invalid candidate")
        : null;
    if (voted.has(voterId))
      return typeof onError === "function" ? onError("already voted") : null;
    // record vote
    votes[candidateId] = (votes[candidateId] || 0) + 1;
    voted.add(voterId);
    return typeof onSuccess === "function"
      ? onSuccess({ voterId, candidateId })
      : null;
  }

  function getResults(sortFn) {
    const results = candidateList.map((c) => ({
      id: c.id,
      name: c.name,
      party: c.party,
      votes: votes[c.id] || 0,
    }));
    if (typeof sortFn === "function") return results.sort(sortFn);
    return results.sort((a, b) => b.votes - a.votes);
  }

  function getWinner() {
    const results = getResults();
    const totalVotes = results.reduce((s, r) => s + r.votes, 0);
    if (totalVotes === 0) return null;
    return results[0];
  }

  return { registerVoter, castVote, getResults, getWinner };
}

export function createVoteValidator(rules) {
  if (!rules || typeof rules !== "object")
    return () => ({ valid: false, reason: "invalid rules" });
  const { minAge = 18, requiredFields = [] } = rules;
  return (voter) => {
    if (!voter || typeof voter !== "object")
      return { valid: false, reason: "invalid voter" };
    for (const f of requiredFields) {
      if (!(f in voter)) return { valid: false, reason: `missing ${f}` };
    }
    if (!Number.isFinite(voter.age) || voter.age < minAge)
      return { valid: false, reason: "underage" };
    return { valid: true };
  };
}

export function countVotesInRegions(regionTree) {
  if (!regionTree || typeof regionTree !== "object") return 0;
  const selfVotes = Number.isFinite(regionTree.votes) ? regionTree.votes : 0;
  if (
    !Array.isArray(regionTree.subRegions) ||
    regionTree.subRegions.length === 0
  )
    return selfVotes;
  let total = selfVotes;
  for (const sub of regionTree.subRegions) {
    total += countVotesInRegions(sub);
  }
  return total;
}

export function tallyPure(currentTally, candidateId) {
  const next = { ...currentTally };
  next[candidateId] =
    (currentTally && Number.isFinite(currentTally[candidateId])
      ? currentTally[candidateId]
      : 0) + 1;
  return next;
}
