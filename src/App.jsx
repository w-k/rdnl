import React, { useMemo, useRef, useState } from "react";
import { lastModified } from "./lastModified";
import { Card, CardContent } from "@/components/ui/card";
import { NumericInput } from "@/components/ui/numeric-input";
import { ComboInput } from "@/components/ui/combo-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Timer, FlaskConical, HelpCircle, Moon, Sun, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_ENV_FRIDGE = 4;
const DEFAULT_TAU = 30;

const toC = (v, unit) =>
  unit === "F" ? ((v - 32) * 5) / 9 : unit === "K" ? v - 273.15 : v;
const fromC = (c, unit) =>
  unit === "F" ? (c * 9) / 5 + 32 : unit === "K" ? c + 273.15 : c;
const unitLabel = (unit) => (unit === "F" ? "°F" : unit === "K" ? "K" : "°C");

function rateAtTemp(T) {
  return Math.pow(1.4, (T - 20) / 5);
}

function temperatureAtTime(
  t,
  T0,
  useFridge,
  Tenv = DEFAULT_ENV_FRIDGE,
  tau = DEFAULT_TAU,
) {
  if (!useFridge) return T0;
  return Tenv + (T0 - Tenv) * Math.exp(-t / tau);
}

function simulateDevTime(baseline, T0, useFridge) {
  const dt = 0.25;
  let t = 0;
  let equiv = 0;
  const curve = [];

  for (let i = 0; i < 2000; i++) {
    const Tt = temperatureAtTime(t, T0, useFridge);
    const r = rateAtTemp(Tt);
    equiv += r * dt;
    curve.push({ t, T: Tt, rate: r, equiv });
    if (equiv >= baseline) break;
    t += dt;
  }

  const devMinutes = t;
  const avgTemp = curve.reduce((s, p, _, arr) => s + p.T, 0) / curve.length;
  const finalTemp = curve[curve.length - 1]?.T ?? T0;
  return { devMinutes, avgTemp, finalTemp, baseline, curve };
}

function classifyRisk(T0, useFridge, devMinutes) {
  if (!useFridge) {
    if (T0 >= 26)
      return {
        msg: "Too hot for stand without cooling — expect blown highlights.",
        color: "bg-red-600",
      };
    if (T0 >= 24)
      return {
        msg: "Very warm — proceed with caution or consider the fridge.",
        color: "bg-orange-500",
      };
    if (T0 >= 18 && T0 <= 22)
      return {
        msg: "Good starting point for classic stand.",
        color: "bg-emerald-600",
      };
    if (T0 < 16)
      return {
        msg: "Quite cool — risk of underdevelopment/flat contrast.",
        color: "bg-sky-600",
      };
    return {
      msg: "Usable — not perfect but manageable.",
      color: "bg-lime-600",
    };
  } else {
    if (devMinutes < 20)
      return {
        msg: "Too fast even with cooling — reduce temp or use 1+100.",
        color: "bg-red-600",
      };
    if (devMinutes > 120)
      return {
        msg: "Very long time — warm up a bit or use 1+50.",
        color: "bg-orange-500",
      };
    return {
      msg: "Cooling-managed stand — stable highlights, restrained shadows.",
      color: "bg-emerald-600",
    };
  }
}

const DILUTION_OPTIONS = [
  { value: 60, label: "1+100" },
  { value: 30, label: "1+50" },
];

function formatMinutesToMMSS(minutes) {
  const totalSeconds = Math.round(minutes * 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export default function App() {
  const [baselineTime, setBaselineTime] = useState(60);
  const [temp, setTemp] = useState(20);
  const [unit, setUnit] = useState("C");
  const [useFridge, setUseFridge] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [dark]);

  const exportRef = useRef(null);
  const timestampRef = useRef(null);
  const dilutionLabel = DILUTION_OPTIONS.find(o => o.value === baselineTime)?.label;

  const handleExport = async () => {
    if (!exportRef.current || !valid || !result) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (timestampRef.current) timestampRef.current.textContent = `Exported ${ts}`;
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `rodinal-stand-${formatMinutesToMMSS(result.devMinutes).replace(':', 'm')}s.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const tempC = toC(temp, unit);
  const valid =
    isFinite(temp) &&
    tempC > -10 &&
    tempC < 60 &&
    isFinite(baselineTime) &&
    baselineTime > 0;

  const switchUnit = (newUnit) => {
    setTemp(Number(fromC(tempC, newUnit).toFixed(1)));
    setUnit(newUnit);
  };

  const result = useMemo(() => {
    if (!valid) return null;
    return simulateDevTime(baselineTime, tempC, useFridge);
  }, [baselineTime, tempC, useFridge, valid]);

  const status = useMemo(() => {
    if (!result || !valid) return null;
    return classifyRisk(tempC, useFridge, result.devMinutes);
  }, [result, tempC, useFridge, valid]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.curve
      .filter((_, idx) => idx % 8 === 0)
      .map((p) => ({
        time: p.t.toFixed(1),
        Temperature: Number(fromC(p.T, unit).toFixed(2)),
        "20°C-equiv mins": Number(p.equiv.toFixed(2)),
      }));
  }, [result, unit]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 p-6">
      <div className="max-w-4xl mx-auto grid gap-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-8xl font-forgetica tracking-wide leading-none">
              RDNL
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
              Rodinal stand development calculator.{" "}
              <a href="https://www.digitaltruth.com/devchart.php?doc=stand" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100">Stand development</a> uses
              highly diluted developer and long times to produce compensating effects in the negative.
              Temperature matters — warm conditions accelerate development and risk blown highlights.
              This calculator models adjusted times for your actual temperature, with optional fridge cooling.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs overflow-hidden">
              {["C", "F", "K"].map((u) => (
                <button
                  key={u}
                  onClick={() => switchUnit(u)}
                  className={`px-2 py-1 transition-colors ${
                    unit === u
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  {unitLabel(u)}
                </button>
              ))}
            </div>
          </div>
          </div>
        </header>

        <button
          onClick={() => setShowHow(!showHow)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors w-fit"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How does it work?
        </button>

        {showHow && (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 sm:p-6 text-sm text-neutral-600 dark:text-neutral-400 grid gap-3">
              <p className="font-medium text-neutral-800 dark:text-neutral-200">How the calculation works</p>
              <p>
                Development times are usually given for 20°C. At different temperatures, chemistry
                runs faster or slower. This calculator uses an exponential rate model: for every
                5°C above 20°C, the development rate increases by a factor of 1.4 (and decreases
                symmetrically below 20°C).
              </p>
              <p>
                The simulation steps through time in 15-second increments, accumulating
                "equivalent minutes at 20°C." When the accumulated equivalent reaches your
                baseline time, development is complete. At a constant temperature this simply
                scales the time, but with fridge cooling the temperature drops over the session,
                so the rate slows progressively.
              </p>
              <p>
                The fridge model uses Newton's law of cooling: the tank temperature decays
                exponentially toward fridge temperature (default 4°C) with a time constant
                τ of 30 minutes. This means the tank loses about 63% of the temperature
                difference in the first 30 minutes.
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                This is a pragmatic model, not a precise chemical simulation. Always verify with test strips and your own workflow.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="relative">
        <button
          onClick={handleExport}
          disabled={!valid || !result}
          className="absolute -top-3 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-sm"
          aria-label="Export as image"
        >
          <Share2 className="w-3 h-3" />
          Export
        </button>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 sm:p-6 grid gap-4">
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label>
                  Time at {fromC(20, unit).toFixed(0)}
                  {unitLabel(unit)} (minutes)
                </Label>
                <ComboInput
                  className="rounded-xl"
                  inputMode="numeric"
                  value={baselineTime}
                  onChange={setBaselineTime}
                  validate={(n) => n > 0}
                  options={DILUTION_OPTIONS}
                />
              </div>
              <div className="grid gap-2">
                <Label>Actual temperature ({unitLabel(unit)})</Label>
                <NumericInput
                  className="rounded-xl"
                  inputMode="decimal"
                  value={temp}
                  onChange={setTemp}
                  validate={(n) => toC(n, unit) > -10 && toC(n, unit) < 60}
                  placeholder={`e.g., ${fromC(20, unit).toFixed(0)}`}
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="grid">
                  <Label className="mb-1">Put tank in fridge</Label>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Assumes {fromC(4, unit).toFixed(0)}
                    {unitLabel(unit)} fridge, τ = 30 min
                  </div>
                </div>
                <Switch checked={useFridge} onCheckedChange={setUseFridge} />
              </div>
            </div>

            {valid && result && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <div className="rounded-2xl p-4 border dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-between">
                    <div className="grid gap-1">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        Calculated development time
                      </div>
                      <div className="text-3xl font-mono font-medium tracking-tight">
                        {formatMinutesToMMSS(result.devMinutes)}
                      </div>
                    </div>
                    {status && (
                      <Badge
                        className={`text-white ${status.color} rounded-xl px-3 py-1`}
                      >
                        {status.msg}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl p-3 border dark:border-neutral-700 bg-white dark:bg-neutral-800">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        Avg. temp
                      </div>
                      <div className="text-lg font-mono font-medium">
                        {fromC(result.avgTemp, unit).toFixed(1)}
                        {unitLabel(unit)}
                      </div>
                    </div>
                    <div className="rounded-2xl p-3 border dark:border-neutral-700 bg-white dark:bg-neutral-800">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        Final temp
                      </div>
                      <div className="text-lg font-mono font-medium">
                        {fromC(result.finalTemp, unit).toFixed(1)}
                        {unitLabel(unit)}
                      </div>
                    </div>
                    <div className="rounded-2xl p-3 border dark:border-neutral-700 bg-white dark:bg-neutral-800">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" />
                        Baseline
                      </div>
                      <div className="text-lg font-mono font-medium">
                        {baselineTime} min
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3">
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Cooling & activity over time
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 4, right: 64, bottom: 20, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#404040' : '#e5e5e5'} />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11, fill: dark ? '#a3a3a3' : '#737373' }}
                          tickLine={false}
                          axisLine={{ stroke: dark ? '#525252' : '#d4d4d4' }}
                          tickFormatter={v => Math.round(Number(v))}
                          label={{
                            value: "time (min)",
                            position: "insideBottom",
                            offset: -12,
                            fontSize: 11,
                            fill: dark ? '#737373' : '#a3a3a3',
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 11, fill: '#8884d8' }}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, "auto"]}
                          label={{
                            value: `temp (${unitLabel(unit)})`,
                            angle: -90,
                            position: "insideLeft",
                            dx: 10,
                            fontSize: 11,
                            fill: '#8884d8',
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11, fill: '#82ca9d' }}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, "auto"]}
                          label={{
                            value: "20°C equiv.",
                            angle: -90,
                            position: "insideRight",
                            dx: -10,
                            fontSize: 11,
                            fill: '#82ca9d',
                          }}
                        />
                        <Tooltip
                          formatter={(v, n) => [v, n]}
                          contentStyle={dark ? { backgroundColor: '#262626', borderColor: '#404040', color: '#e5e5e5' } : undefined}
                          labelStyle={dark ? { color: '#e5e5e5' } : undefined}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Temperature"
                          stroke="#8884d8"
                          dot={false}
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="20°C-equiv mins"
                          stroke="#82ca9d"
                          dot={false}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <footer className="text-xs text-neutral-400 dark:text-neutral-500 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <span>
            <a href="https://wawr.eu" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">Pawel Wawreszuk</a>
            {" · "}
            <a href="mailto:p@wawr.eu" className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">p@wawr.eu</a>
          </span>
          <span>Last modified {lastModified}</span>
        </footer>
      </div>

      {valid && result && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={exportRef} className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 p-6" style={{ width: 900 }}>
            <div className="text-lg font-semibold mb-4">Rodinal Stand Development Calculator</div>
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-1">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Time at {fromC(20, unit).toFixed(0)}{unitLabel(unit)} (minutes)
                    </div>
                    <div className="text-sm font-medium">
                      {baselineTime} min{dilutionLabel ? ` (${dilutionLabel})` : ''}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Actual temperature ({unitLabel(unit)})
                    </div>
                    <div className="text-sm font-medium">
                      {temp} {unitLabel(unit)}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Fridge cooling
                    </div>
                    <div className="text-sm font-medium">
                      {useFridge ? `Yes (${fromC(4, unit).toFixed(0)}${unitLabel(unit)}, τ\u00a0=\u00a030\u00a0min)` : 'No'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <div className="rounded-2xl p-4 border dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-between">
                      <div className="grid gap-1">
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          Calculated development time
                        </div>
                        <div className="text-3xl font-mono font-medium tracking-tight">
                          {formatMinutesToMMSS(result.devMinutes)}
                        </div>
                      </div>
                      {status && (
                        <Badge className={`text-white ${status.color} rounded-xl px-3 py-1`}>
                          {status.msg}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl p-3 border dark:border-neutral-700 bg-white dark:bg-neutral-800">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          Avg. temp
                        </div>
                        <div className="text-lg font-mono font-medium">
                          {fromC(result.avgTemp, unit).toFixed(1)}
                          {unitLabel(unit)}
                        </div>
                      </div>
                      <div className="rounded-2xl p-3 border dark:border-neutral-700 bg-white dark:bg-neutral-800">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          Final temp
                        </div>
                        <div className="text-lg font-mono font-medium">
                          {fromC(result.finalTemp, unit).toFixed(1)}
                          {unitLabel(unit)}
                        </div>
                      </div>
                      <div className="rounded-2xl p-3 border dark:border-neutral-700 bg-white dark:bg-neutral-800">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <FlaskConical className="w-3 h-3" />
                          Baseline
                        </div>
                        <div className="text-lg font-mono font-medium">
                          {baselineTime} min
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      Cooling & activity over time
                    </div>
                    <LineChart width={390} height={224} data={chartData} margin={{ top: 4, right: 64, bottom: 20, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#404040' : '#e5e5e5'} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: dark ? '#a3a3a3' : '#737373' }}
                        tickLine={false}
                        axisLine={{ stroke: dark ? '#525252' : '#d4d4d4' }}
                        tickFormatter={v => Math.round(Number(v))}
                        label={{
                          value: "time (min)",
                          position: "insideBottom",
                          offset: -12,
                          fontSize: 11,
                          fill: dark ? '#737373' : '#a3a3a3',
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#8884d8' }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, "auto"]}
                        label={{
                          value: `temp (${unitLabel(unit)})`,
                          angle: -90,
                          position: "insideLeft",
                          dx: 10,
                          fontSize: 11,
                          fill: '#8884d8',
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#82ca9d' }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, "auto"]}
                        label={{
                          value: "20°C equiv.",
                          angle: -90,
                          position: "insideRight",
                          dx: -10,
                          fontSize: 11,
                          fill: '#82ca9d',
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="Temperature"
                        stroke="#8884d8"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="20°C-equiv mins"
                        stroke="#82ca9d"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div ref={timestampRef} className="text-xs text-neutral-400 dark:text-neutral-500 mt-3" />
          </div>
        </div>
      )}
    </div>
  );
}
