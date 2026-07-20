# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

RANK_XP = {1: 500, 2: 300, 3: 150, 4: 50, 5: 50, 6: 50}
MAX_RESPONSE_LEN = 280  # tweet length
MAX_ROUNDS = 50
MAX_PLAYERS = 6


def _safe_address(raw: str) -> Address:
    return Address(raw.lower())


def _validate_game_id(game_id: str) -> None:
    if not isinstance(game_id, str) or len(game_id) < 4 or len(game_id) > 80:
        raise Exception("bad game_id")


class DiplomaticCrisis(gl.Contract):
    xp:        TreeMap[Address, u256]
    games:     TreeMap[Address, u256]
    last_week: TreeMap[Address, u256]
    submissions: TreeMap[str, str]
    finalized:   TreeMap[str, u256]
    results:     TreeMap[str, str]

    def __init__(self) -> None:
        pass

    @gl.public.write
    def submit_entry(self, game_id: str, round_num: int, persona: str, response: str) -> None:
        # `persona` parameter kept for ABI compatibility but ignored — diplomats
        # reply under their own identity. Pass an empty string from the client.
        _validate_game_id(game_id)
        if not isinstance(round_num, int) or round_num < 1 or round_num > MAX_ROUNDS:
            raise Exception("bad round")
        if not isinstance(response, str) or len(response) == 0 or len(response) > MAX_RESPONSE_LEN:
            raise Exception("bad response")
        if self.finalized.get(game_id, u256(0)) != u256(0):
            raise Exception("game already finalized")

        sender = gl.message.sender_address.as_hex.lower()
        existing = self.submissions.get(game_id, "")
        entries = json.loads(existing) if existing else []

        replaced = False
        for e in entries:
            if int(e.get("round", 0)) == round_num and e.get("addr", "").lower() == sender:
                e["response"] = response
                replaced = True
                break
        if not replaced:
            entries.append({
                "round": round_num,
                "addr": sender,
                "response": response,
            })

        self.submissions[game_id] = json.dumps(entries)

    @gl.public.write
    def finalize_game(self, game_id: str, scenarios_json: str, current_week: int) -> str:
        _validate_game_id(game_id)
        if self.finalized.get(game_id, u256(0)) != u256(0):
            raise Exception("game already finalized")

        scenarios_meta = json.loads(scenarios_json)
        if not isinstance(scenarios_meta, list) or len(scenarios_meta) == 0:
            raise Exception("empty scenarios")

        existing = self.submissions.get(game_id, "")
        if not existing:
            raise Exception("no entries for this game")
        entries = json.loads(existing)

        by_round: dict = {}
        all_addresses = set()
        for e in entries:
            rn = int(e.get("round", 0))
            addr = e.get("addr", "")
            response = e.get("response", "")
            if rn < 1 or not addr or not response:
                continue
            by_round.setdefault(rn, []).append({
                "address": addr,
                "response": response,
            })
            all_addresses.add(addr)

        if len(all_addresses) < 2:
            raise Exception("Need at least 2 diplomats")
        if len(all_addresses) > MAX_PLAYERS:
            raise Exception(f"Maximum {MAX_PLAYERS} delegates per session")

        rounds = []
        for meta in scenarios_meta:
            rn = int(meta.get("round", 0))
            rounds.append({
                "round": rn,
                "scenario": str(meta.get("scenario", "")),
                "entries": by_round.get(rn, []),
            })

        num_players = len(all_addresses)
        num_rounds = len(rounds)

        # Committed roster the LLM MUST score — normalized to lowercase hex.
        # Validators bind the leader's output to exactly this set so a
        # well-shaped but fabricated response cannot invent, drop, or
        # duplicate delegates to redirect XP.
        committed_roster = frozenset(a.lower() for a in all_addresses)

        rounds_text = ""
        for r in rounds:
            rounds_text += f"\n--- Round {r['round']} | Crisis: {r['scenario']} ---\n"
            for e in r["entries"]:
                rounds_text += f"  [{e['address']}] dispatch=\"{e['response']}\"\n"

        prompt = f"""You are an impartial AI panel scoring DIPLOMATIC CRISIS, a {num_rounds}-round geopolitical simulation on the GenLayer blockchain.

Each round, every delegate is presented the SAME fictional geopolitical crisis and writes a (≤280 char) diplomatic response. Your job is to evaluate each delegate's OVERALL performance across ALL rounds.

{rounds_text}

For EACH of the {num_players} delegates, score their overall performance with THREE metrics on a 0-100 scale:
1. wit (0-100) - How sharp, clever, and memorable is the rhetoric? Diplomatic zingers, double meanings, deft phrasing.
2. plausibility (0-100) - Does the response sound like something a real foreign ministry / head of state could realistically issue? Internal consistency, knowledge of geopolitics.
3. diplomatic_tone (0-100) - Is the register appropriate — measured, formal where needed, escalatory only when the situation calls for it? Avoiding crassness, slurs, or wholly unprofessional language.

Final per-delegate score formula (you compute it):
  total = round((wit + plausibility + diplomatic_tone) / 3)

Rules:
- Judge each delegate HOLISTICALLY across all rounds
- Be fair but discriminating — avoid clustering everyone at the same score
- You MUST include ALL {num_players} delegates in the results, using the EXACT full addresses provided above
- Rank delegates by total score (highest first)

Return ONLY valid JSON with this exact schema:
{{"results": [{{"address": "0xFULL_ADDRESS", "wit": 78, "plausibility": 65, "diplomatic_tone": 80, "total": 74, "verdict": "short witty one-line verdict on their diplomatic performance"}}], "winner": "0xWINNER_ADDRESS"}}"""

        def leader_fn():
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise Exception("LLM returned non-dict")
            results = result.get("results")
            if not isinstance(results, list) or len(results) == 0:
                raise Exception("Missing results array")

            # Reconcile every scored entry back to a committed roster address
            # (case-insensitive). Reject foreign/duplicate addresses so the
            # leader never emits a roster the validators would (correctly)
            # slash. Scores stay as the LLM produced them.
            normalized = {}
            for r in results:
                addr = r.get("address")
                if not isinstance(addr, str):
                    raise Exception("result missing address")
                key = addr.lower()
                if key not in committed_roster:
                    raise Exception("scored an unknown delegate")
                if key in normalized:
                    raise Exception("duplicate delegate in results")
                wit = max(0, min(100, int(round(float(r.get("wit", 50))))))
                plaus = max(0, min(100, int(round(float(r.get("plausibility", 50))))))
                tone = max(0, min(100, int(round(float(r.get("diplomatic_tone", 50))))))
                verdict = r.get("verdict")
                if not isinstance(verdict, str) or len(verdict) == 0:
                    verdict = "The panel withholds comment."
                normalized[key] = {
                    "address": key,
                    "wit": wit,
                    "plausibility": plaus,
                    "diplomatic_tone": tone,
                    "total": int(round((wit + plaus + tone) / 3)),
                    "verdict": verdict,
                }

            if set(normalized.keys()) != committed_roster:
                raise Exception("results do not cover the committed roster")

            # Deterministic ordering: total desc, then address for stable ties.
            ordered = sorted(
                normalized.values(),
                key=lambda x: (-x["total"], x["address"]),
            )
            for i, r in enumerate(ordered):
                r["rank"] = i + 1
            return json.dumps(
                {"results": ordered, "winner": ordered[0]["address"]},
                sort_keys=True,
            )

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
            except Exception:
                return False
            if not isinstance(data, dict):
                return False
            results = data.get("results")
            if not isinstance(results, list) or len(results) == 0:
                return False

            # ---- Bind results to the committed roster ------------------
            # The scored delegates must be EXACTLY the addresses that
            # actually submitted entries for this game — no missing, extra,
            # or duplicated addresses. This is the deterministic anchor the
            # validator recomputes from on-chain state, independent of the
            # leader's (nondeterministic) LLM output.
            if len(results) != num_players:
                return False
            seen = set()
            for r in results:
                if not isinstance(r, dict):
                    return False
                addr = r.get("address")
                if not isinstance(addr, str):
                    return False
                norm = addr.lower()
                if norm in seen:
                    return False  # duplicate delegate
                seen.add(norm)
            if seen != committed_roster:
                return False  # fabricated / mismatched roster

            # ---- Verify per-delegate scoring + ranking invariants ------
            prev_total = None
            for i, r in enumerate(results):
                wit = r.get("wit")
                plaus = r.get("plausibility")
                tone = r.get("diplomatic_tone")
                for val in (wit, plaus, tone):
                    if not isinstance(val, (int, float)) or isinstance(val, bool):
                        return False
                    if val < 0 or val > 100:
                        return False

                total = r.get("total")
                if not isinstance(total, (int, float)) or isinstance(total, bool):
                    return False
                # total must be the honest aggregate of the three metrics.
                if int(total) != int(round((wit + plaus + tone) / 3)):
                    return False

                # rank must be dense and 1-based in listed order, and the
                # list must be sorted by total descending.
                if r.get("rank") != i + 1:
                    return False
                if prev_total is not None and total > prev_total:
                    return False
                prev_total = total

                if not isinstance(r.get("verdict"), str):
                    return False

            # ---- Bind the winner to the actual top-ranked delegate -----
            winner = data.get("winner")
            if not isinstance(winner, str):
                return False
            if winner.lower() != results[0].get("address", "").lower():
                return False

            return True

        verdict_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        verdict = json.loads(verdict_str)

        xp_awards = []
        for result in verdict["results"]:
            try:
                addr = _safe_address(result["address"])
            except Exception:
                result["xp_earned"] = 50
                xp_awards.append(result)
                continue

            rank = min(result.get("rank", 6), 6)
            xp_earned = RANK_XP.get(rank, 50)

            self.xp[addr]        = self.xp.get(addr, u256(0)) + u256(xp_earned)
            self.games[addr]     = self.games.get(addr, u256(0)) + u256(1)
            self.last_week[addr] = u256(current_week)

            result["xp_earned"] = xp_earned
            xp_awards.append(result)

        self.finalized[game_id] = u256(1)
        final_payload = json.dumps({"num_rounds": num_rounds, "results": xp_awards, "winner": verdict["winner"]})
        self.results[game_id] = final_payload
        return final_payload

    @gl.public.view
    def get_game_result(self, game_id: str) -> str:
        return self.results.get(game_id, "")

    @gl.public.view
    def get_submission_count(self, game_id: str) -> int:
        existing = self.submissions.get(game_id, "")
        if not existing:
            return 0
        try:
            return len(json.loads(existing))
        except Exception:
            return 0

    @gl.public.view
    def is_finalized(self, game_id: str) -> bool:
        return self.finalized.get(game_id, u256(0)) != u256(0)

    @gl.public.view
    def get_leaderboard(self) -> str:
        players = [{"address": addr.as_hex, "xp": int(xp), "games": int(self.games.get(addr, u256(0)))}
                   for addr, xp in self.xp.items()]
        players.sort(key=lambda p: p["xp"], reverse=True)
        return json.dumps(players)

    @gl.public.view
    def get_player_xp(self, player: str) -> int:
        return int(self.xp.get(_safe_address(player), u256(0)))

    @gl.public.view
    def get_player_stats(self, player: str) -> str:
        addr = _safe_address(player)
        return json.dumps({"xp": int(self.xp.get(addr, u256(0))), "games": int(self.games.get(addr, u256(0)))})

    @gl.public.view
    def get_last_played_week(self, player: str) -> int:
        return int(self.last_week.get(_safe_address(player), u256(0)))
