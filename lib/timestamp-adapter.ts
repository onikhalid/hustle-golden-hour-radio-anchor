import { GameEvent } from "@/lib/production-timestamps";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function msToHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Convert GameEvent[] (ms timestamps) into the flattened keyed HH:MM:SS array
 * Example per-question keys: `1st_quest`, `1st_timer_start`, `1st_timer_end`, `1st_result`
 */
export function eventsToFlatTimestamps(events: GameEvent[]): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  if (!events || events.length === 0) return out;

  const questionNumbers = Array.from(
    new Set(events.filter(e => typeof e.questionNumber === 'number').map(e => e.questionNumber as number))
  ).sort((a, b) => a - b);

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  for (const qn of questionNumbers) {
    const qEvents = events.filter(e => e.questionNumber === qn);

    const findType = (type: GameEvent['type']) => qEvents.find(e => e.type === type) || null;

    const questEvent = findType('question_start');
    const timerStartEvent = findType('time_starts');
    const timerEndEvent = findType('time_up');
    const resultEvent = findType('results_start');

    const ord = ordinal(qn);

    out.push({ [`${ord}_quest`]: questEvent ? msToHHMMSS(questEvent.timestamp) : "00:00:00" });
    out.push({ [`${ord}_timer_start`]: timerStartEvent ? msToHHMMSS(timerStartEvent.timestamp) : "00:00:00" });
    out.push({ [`${ord}_timer_end`]: timerEndEvent ? msToHHMMSS(timerEndEvent.timestamp) : "00:00:00" });
    out.push({ [`${ord}_result`]: resultEvent ? msToHHMMSS(resultEvent.timestamp) : "00:00:00" });
  }

  return out;
}

export default eventsToFlatTimestamps;
