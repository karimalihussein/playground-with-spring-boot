import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ChartPoint } from "../lib/types";

type LabCtx = {
  count: number;
  setCount: (n: number) => void;
  slowConsumerMs: number;
  setSlowConsumerMs: (n: number) => void;
  slowConsumerOn: boolean;
  setSlowConsumerOn: (v: boolean) => void;
  streamEmitDelayMs: number;
  setStreamEmitDelayMs: (n: number) => void;
  wsFrameDelayMs: number;
  setWsFrameDelayMs: (n: number) => void;
  concurrentUsers: number;
  setConcurrentUsers: (n: number) => void;
  artificialLatencyMs: number;
  setArtificialLatencyMs: (n: number) => void;
  chartWindow: ChartPoint[];
  pushChartSample: (partial: Omit<ChartPoint, "t">) => void;
  resetCharts: () => void;
  queueDepth: number;
  setQueueDepth: (n: number) => void;
  addQueue: (delta: number) => void;
};

const Ctx = createContext<LabCtx | null>(null);

export function GlobalLabProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(14);
  const [slowConsumerMs, setSlowConsumerMs] = useState(120);
  const [slowConsumerOn, setSlowConsumerOn] = useState(false);
  const [streamEmitDelayMs, setStreamEmitDelayMs] = useState(55);
  const [wsFrameDelayMs, setWsFrameDelayMs] = useState(45);
  const [concurrentUsers, setConcurrentUsers] = useState(1);
  const [artificialLatencyMs, setArtificialLatencyMs] = useState(0);
  const [queueDepth, setQueueDepth] = useState(0);
  const chartRef = useRef<ChartPoint[]>([]);
  const [, bump] = useState(0);

  const pushChartSample = useCallback((partial: Omit<ChartPoint, "t">) => {
    const last = chartRef.current.at(-1);
    const t = last ? last.t + 1 : 0;
    chartRef.current = [...chartRef.current.slice(-80), { t, ...partial }];
    bump((x) => x + 1);
  }, []);

  const resetCharts = useCallback(() => {
    chartRef.current = [];
    bump((x) => x + 1);
  }, []);

  const addQueue = useCallback((delta: number) => {
    setQueueDepth((q) => Math.max(0, q + delta));
  }, []);

  const chartWindow = chartRef.current;

  const value = useMemo(
    () =>
      ({
        count,
        setCount,
        slowConsumerMs,
        setSlowConsumerMs,
        slowConsumerOn,
        setSlowConsumerOn,
        streamEmitDelayMs,
        setStreamEmitDelayMs,
        wsFrameDelayMs,
        setWsFrameDelayMs,
        concurrentUsers,
        setConcurrentUsers,
        artificialLatencyMs,
        setArtificialLatencyMs,
        chartWindow,
        pushChartSample,
        resetCharts,
        queueDepth,
        setQueueDepth,
        addQueue,
      }) satisfies LabCtx,
    [
      count,
      slowConsumerMs,
      slowConsumerOn,
      streamEmitDelayMs,
      wsFrameDelayMs,
      concurrentUsers,
      artificialLatencyMs,
      chartWindow,
      pushChartSample,
      resetCharts,
      queueDepth,
      addQueue,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLab() {
  const x = useContext(Ctx);
  if (!x) throw new Error("useLab inside GlobalLabProvider");
  return x;
}
