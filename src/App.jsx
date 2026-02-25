import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NumericInput } from "@/components/ui/numeric-input";
import { ComboInput } from "@/components/ui/combo-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Timer, FlaskConical } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_ENV_FRIDGE = 4;
const DEFAULT_TAU = 30;

const toC = (v, unit) =>
  unit === "F" ? ((v - 32) * 5) / 9 : unit === "K" ? v - 273.15 : v;
const fromC = (c, unit) =>
  unit === "F" ? (c * 9) / 5 + 32 : unit === "K" ? c + 273.15 : c;
const unitLabel = (unit) =>
  unit === "F" ? "°F" : unit === "K" ? "K" : "°C";

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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-4xl mx-auto grid gap-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Rodinal Stand Development Calculator
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Fridge-aware timing with a pragmatic temperature model.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-neutral-200 text-xs overflow-hidden">
              {["C", "F", "K"].map((u) => (
                <button
                  key={u}
                  onClick={() => switchUnit(u)}
                  className={`px-2 py-1 transition-colors ${
                    unit === u
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {unitLabel(u)}
                </button>
              ))}
            </div>
            <Badge className="text-xs" variant="secondary">
              Beta
            </Badge>
          </div>
        </header>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 sm:p-6 grid gap-4">
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label>Time at {fromC(20, unit).toFixed(0)}{unitLabel(unit)} (minutes)</Label>
                <ComboInput
                  className="rounded-xl"
                  inputMode="numeric"
                  value={baselineTime}
                  onChange={setBaselineTime}
                  validate={(n) => n > 0}
                  options={[
                    { value: 60, label: "1+100" },
                    { value: 30, label: "1+50" },
                  ]}
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
                  <div className="text-xs text-neutral-500">
                    Assumes {fromC(4, unit).toFixed(0)}{unitLabel(unit)} fridge, τ = 30 min
                  </div>
                </div>
                <Switch checked={useFridge} onCheckedChange={setUseFridge} />
              </div>
            </div>

            {valid && result && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Timer className="w-4 h-4" />
                    Baseline at {fromC(20, unit).toFixed(0)}{unitLabel(unit)}: {baselineTime} min • Modeled dev time
                    below
                  </div>
                  <div className="rounded-2xl p-4 border bg-white flex items-center justify-between">
                    <div className="grid gap-1">
                      <div className="text-sm text-neutral-500">
                        Calculated development time
                      </div>
                      <div className="text-3xl font-semibold tracking-tight">
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
                    <div className="rounded-2xl p-3 border bg-white">
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        Avg. temp
                      </div>
                      <div className="text-lg font-medium">
                        {fromC(result.avgTemp, unit).toFixed(1)}{unitLabel(unit)}
                      </div>
                    </div>
                    <div className="rounded-2xl p-3 border bg-white">
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        Final temp
                      </div>
                      <div className="text-lg font-medium">
                        {fromC(result.finalTemp, unit).toFixed(1)}{unitLabel(unit)}
                      </div>
                    </div>
                    <div className="rounded-2xl p-3 border bg-white">
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" />
                        Baseline
                      </div>
                      <div className="text-lg font-medium">
                        {baselineTime} min
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 leading-snug">
                    Notes: This is a pragmatic model, not gospel. Always test
                    with your film, water, and workflow.
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-sm text-neutral-600 mb-2">
                    Cooling & activity over time
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 12 }}
                          label={{
                            value: "Minutes",
                            position: "insideBottomRight",
                            offset: -4,
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          domain={[0, "auto"]}
                          label={{
                            value: unitLabel(unit),
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          domain={[0, "auto"]}
                          label={{
                            value: "Eq. mins",
                            angle: -90,
                            position: "insideRight",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip formatter={(v, n) => [v, n]} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Temperature"
                          dot={false}
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="20°C-equiv mins"
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
    </div>
  );
}
