import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ChevronRight, Vote, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type PollKind = "encuesta" | "votacion";

interface NoticePoll {
  id: string;
  kind: PollKind;
  title: string;
  created_at: string;
  closes_at: string | null;
}

interface ResultItem {
  id: string;
  label: string;
  votes: number;
}

interface NoticeContent {
  poll: NoticePoll;
  results: ResultItem[];
  isDemo?: boolean;
}

const DEMO_KEY = "arcana_poll_notice_demo_v2";
const REMINDER_PREFIX = "arcana_poll_reminder";
const DEMO_POLL: NoticeContent = {
  isDemo: true,
  poll: {
    id: "poll-demo",
    kind: "encuesta",
    title: "Ejemplo: Vestimenta para el próximo servicio",
    created_at: new Date().toISOString(),
    closes_at: null,
  },
  results: [
    { id: "demo-1", label: "Azul marino", votes: 12 },
    { id: "demo-2", label: "Blanco", votes: 8 },
    { id: "demo-3", label: "Azul eléctrico", votes: 5 },
  ],
};

function dominicanDateParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

function reminderSlot() {
  const { date, hour } = dominicanDateParts();
  if (hour < 8) return null;
  return `${date}_${hour < 17 ? "morning" : "evening"}`;
}

function isOpen(poll: NoticePoll) {
  return !poll.closes_at || new Date(poll.closes_at).getTime() > Date.now();
}

export default function PollActivityNotice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<NoticeContent | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissalTimer = useRef<number | null>(null);
  const demoPending = useRef(false);
  const visibleContent = useRef<NoticeContent | null>(null);

  const clearDismissalTimer = useCallback(() => {
    if (dismissalTimer.current !== null) {
      window.clearTimeout(dismissalTimer.current);
      dismissalTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissalTimer();
    visibleContent.current = null;
    setVisible(false);
  }, [clearDismissalTimer]);

  const show = useCallback((next: NoticeContent) => {
    clearDismissalTimer();
    visibleContent.current = next;
    setContent(next);
    setVisible(true);
    dismissalTimer.current = window.setTimeout(() => setVisible(false), 15_000);
  }, [clearDismissalTimer]);

  const refreshVisibleResults = useCallback(async () => {
    const currentContent = visibleContent.current;
    if (!currentContent || currentContent.isDemo) return;
    const [{ data: optionRows }, { data: voteRows }] = await Promise.all([
      supabase
        .from("poll_options")
        .select("id, label")
        .eq("poll_id", currentContent.poll.id)
        .order("sort_order", { ascending: true }),
      supabase.from("poll_votes").select("option_id").eq("poll_id", currentContent.poll.id),
    ]);
    const totals = new Map<string, number>();
    (voteRows || []).forEach((vote) => {
      totals.set(vote.option_id, (totals.get(vote.option_id) || 0) + 1);
    });
    setContent((current) => current && current.poll.id === currentContent.poll.id ? {
      ...current,
      results: (optionRows || []).map((option) => ({
        id: option.id,
        label: option.label,
        votes: totals.get(option.id) || 0,
      })),
    } : current);
  }, []);

  const checkForNotice = useCallback(async () => {
    if (!user?.id || demoPending.current) return;

    try {
      if (localStorage.getItem(DEMO_KEY) !== "1") {
        demoPending.current = true;
        localStorage.setItem(DEMO_KEY, "1");
        window.setTimeout(() => {
          show(DEMO_POLL);
          demoPending.current = false;
        }, 900);
        return;
      }

      const slot = reminderSlot();
      if (!slot) return;

      const { data: pollsData, error: pollsError } = await supabase
        .from("polls")
        .select("id, kind, title, created_at, closes_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      if (pollsError) throw pollsError;

      const openPolls = ((pollsData || []) as NoticePoll[]).filter(isOpen);
      if (!openPolls.length) return;

      const ids = openPolls.map((poll) => poll.id);
      const { data: participantRows } = await supabase
        .from("poll_participants")
        .select("poll_id")
        .eq("user_id", user.id)
        .in("poll_id", ids);
      const participated = new Set((participantRows || []).map((row) => row.poll_id));
      const poll = openPolls.find((item) => {
        const key = `${REMINDER_PREFIX}_${user.id}_${item.id}_${slot}`;
        return !participated.has(item.id) && localStorage.getItem(key) !== "1";
      });
      if (!poll) return;

      const { data: optionRows } = await supabase
        .from("poll_options")
        .select("id, label")
        .eq("poll_id", poll.id)
        .order("sort_order", { ascending: true });
      const { data: voteRows } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id);
      const totals = new Map<string, number>();
      (voteRows || []).forEach((vote) => {
        totals.set(vote.option_id, (totals.get(vote.option_id) || 0) + 1);
      });

      localStorage.setItem(`${REMINDER_PREFIX}_${user.id}_${poll.id}_${slot}`, "1");
      show({
        poll,
        results: (optionRows || []).map((option) => ({
          id: option.id,
          label: option.label,
          votes: totals.get(option.id) || 0,
        })),
      });
    } catch (error) {
      console.error("No se pudo cargar el aviso de encuestas:", error);
    }
  }, [show, user?.id]);

  useEffect(() => {
    checkForNotice();
    const interval = window.setInterval(checkForNotice, 60_000);
    const channel = supabase
      .channel(`poll-activity-${user?.id || "guest"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, checkForNotice)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => {
        checkForNotice();
        refreshVisibleResults();
      })
      .subscribe();

    return () => {
      window.clearInterval(interval);
      clearDismissalTimer();
      supabase.removeChannel(channel);
    };
  }, [checkForNotice, clearDismissalTimer, refreshVisibleResults, user?.id]);

  const totalVotes = useMemo(
    () => content?.results.reduce((sum, result) => sum + result.votes, 0) || 0,
    [content],
  );

  if (!visible || !content) return null;

  const isVoting = content.poll.kind === "votacion";
  const Icon = isVoting ? Vote : BarChart3;
  const destination = isVoting ? "/votaciones" : "/encuestas";
  const resultText = content.results.length
    ? content.results
        .map((result) => {
          const percentage = totalVotes ? Math.round((result.votes / totalVotes) * 100) : 0;
          return `${result.label}: ${percentage}%`;
        })
        .join("  •  ")
    : "Aún no hay resultados";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl px-3 pb-3 animate-slide-in-right">
        <div className="overflow-hidden rounded-lg border border-primary-glow/40 bg-primary text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-glow/20">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-normal text-primary-foreground/70">
                {content.isDemo ? "Demostración · " : "Nueva · "}
                {isVoting ? "Votación" : "Encuesta"}
              </p>
              <p className="break-words text-sm font-semibold leading-tight">{content.poll.title}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 shrink-0 px-2"
              onClick={() => {
                dismiss();
                navigate(destination);
              }}
            >
              Ver <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Cerrar aviso"
              onClick={dismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="border-t border-primary-foreground/15 bg-primary-glow/15 py-2">
            <div className="poll-results-ticker whitespace-nowrap text-xs font-medium">
              <span>{resultText} &nbsp; • &nbsp; {totalVotes} votos en total</span>
              <span aria-hidden="true">{resultText} &nbsp; • &nbsp; {totalVotes} votos en total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}