import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Info, Thermometer, Timer, FlaskConical } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BASE_TIMES = { "1+100": 60, "1+50": 30 };
const DEFAULT_ENV_FRIDGE = 4;
const DEFAULT_TAU = 30;

function rateAtTemp(T) {
  return Math.pow(1.4, (T - 20) / 5);
}

function temperatureAtTime(t, T0, useFridge, Tenv = DEFAULT_ENV_FRIDGE, tau = DEFAULT_TAU) {
  if (!useFridge) return T0;
  return Tenv + (T0 - Tenv) * Math.exp(-t / tau);
}

function simulateDevTime(dilution, T0, useFridge) {
  const baseline = BASE_TIMES[dilution] ?? 60;
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
    if (T0 >= 26) return { msg: "Too hot for stand without cooling — expect blown highlights.", color: "bg-red-600" };
    if (T0 >= 24) return { msg: "Very warm — proceed with caution or consider the fridge.", color: "bg-orange-500" };
    if (T0 >= 18 && T0 <= 22) return { msg: "Good starting point for classic stand.", color: "bg-emerald-600" };
    if (T0 < 16) return { msg: "Quite cool — risk of underdevelopment/flat contrast.", color: "bg-sky-600" };
    return { msg: "Usable — not perfect but manageable.", color: "bg-lime-600" };
  } else {
    if (devMinutes < 20) return { msg: "Too fast even with cooling — reduce temp or use 1+100.", color: "bg-red-600" };
    if (devMinutes > 120) return { msg: "Very long time — warm up a bit or use 1+50.", color: "bg-orange-500" };
    return { msg: "Cooling-managed stand — stable highlights, restrained shadows.", color: "bg-emerald-600" };
  }
}

function formatMinutesToMMSS(minutes) {
  const totalSeconds = Math.round(minutes * 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

export default function App() {
  const [dilution, setDilution] = useState("1+100");
  const [temp, setTemp] = useState("20");
  const [useFridge, setUseFridge] = useState(false);

  const parsedTemp = Number(temp);
  const valid = isFinite(parsedTemp) && parsedTemp > -10 && parsedTemp < 60;

  const result = useMemo(() => {
    if (!valid) return null;
    return simulateDevTime(dilution, parsedTemp, useFridge);
  }, [dilution, parsedTemp, useFridge, valid]);

  const status = useMemo(() => {
    if (!result || !valid) return null;
    return classifyRisk(parsedTemp, useFridge, result.devMinutes);
  }, [result, parsedTemp, useFridge, valid]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.curve.filter((_, idx) => idx % 8 === 0).map((p) => ({
      time: p.t.toFixed(1),
      Temperature: Number(p.T.toFixed(2)),
      "20°C-equiv mins": Number(p.equiv.toFixed(2)),
    }));
  }, [result]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-4xl mx-auto grid gap-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Rodinal Stand Development Calculator</h1>
            <p className="text-sm text-neutral-600 mt-1">Fridge-aware timing with a pragmatic temperature model.</p>
          </div>
          <Badge className="text-xs" variant="secondary">Beta • Model-based</Badge>
        </header>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 sm:p-6 grid gap-4">
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label>Dilution</Label>
                <Select value={dilution} onValueChange={setDilution}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1+100">1+100</SelectItem>
                    <SelectItem value="1+50">1+50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Initial temperature (°C)</Label>
                <Input
                  className="rounded-xl"
                  inputMode="decimal"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="grid">
                  <Label className="mb-1">Put tank in fridge</Label>
                  <div className="text-xs text-neutral-500">Assumes 4°C fridge, τ = 30 min</div>
                </div>
                <Switch checked={useFridge} onCheckedChange={setUseFridge} />
              </div>
            </div>

            {!valid && (
              <div className="text-sm text-red-600 flex items-center gap-2"><Info className="w-4 h-4"/> Enter a valid temperature between -10 and 60°C.</div>
            )}

            {valid && result && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Timer className="w-4 h-4"/>
                    Baseline at 20°C: {BASE_TIMES[dilution]} min • Modeled dev time below
                  </div>
                  <div className="rounded-2xl p-4 border bg-white flex items-center justify-between">
                    <div className="grid gap-1">
                      <div className="text-sm text-neutral-500">Calculated development time</div>
                      <div className="text-3xl font-semibold tracking-tight">{formatMinutesToMMSS(result.devMinutes)}</div>
                    </div>
                    {status && (
                      <Badge className={`text-white ${status.color} rounded-xl px-3 py-1`}>{status.msg}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl p-3 border bg-white">
                      <div className="text-xs text-neutral-500 flex items-center gap-1"><Thermometer className="w-3 h-3"/>Avg. temp</div>
                      <div className="text-lg font-medium">{result.avgTemp.toFixed(1)}°C</div>
                    </div>
                    <div className="rounded-2xl p-3 border bg-white">
                      <div className="text-xs text-neutral-500 flex items-center gap-1"><Thermometer className="w-3 h-3"/>Final temp</div>
                      <div className="text-lg font-medium">{result.finalTemp.toFixed(1)}°C</div>
                    </div>
                    <div className="rounded-2xl p-3 border bg-white">
                      <div className="text-xs text-neutral-500 flex items-center gap-1"><FlaskConical className="w-3 h-3"/>Dilution</div>
                      <div className="text-lg font-medium">{dilution}</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 leading-snug">
                    Notes: This is a pragmatic model, not gospel. Always test with your film, water, and workflow.
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-sm text-neutral-600 mb-2">Cooling & activity over time</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} label={{ value: "Minutes", position: "insideBottomRight", offset: -4, fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={[0, "auto"]} label={{ value: "°C", angle: -90, position: "insideLeft", fontSize: 12 }}/>
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, "auto"]} label={{ value: "Eq. mins", angle: -90, position: "insideRight", fontSize: 12 }}/>
                        <Tooltip formatter={(v, n) => [v, n]} />
                        <Line yAxisId="left" type="monotone" dataKey="Temperature" dot={false} strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="20°C-equiv mins" dot={false} strokeWidth={2} />
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
