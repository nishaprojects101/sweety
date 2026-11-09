import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate, todayString } from '../constants.js';

const REPORTS = [
  { type: 'daily', title: 'Daily' },
  { type: 'month-to-date', title: 'Month-to-date' },
  { type: 'monthly', title: 'Previous month' },
];

function rangeText(r) {
  return r.from === r.to ? formatDate(r.from) : `${formatDate(r.from)} – ${formatDate(r.to)}`;
}

function Stat({ label, value, unit }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}{unit && <small> {unit}</small>}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ReportCard({ title, report, error }) {
  return (
    <section className="card report">
      <h3>{title}</h3>
      {error && <p className="error" role="alert">{error}</p>}
      {!error && !report && <p className="muted">Loading…</p>}
      {report && (
        <>
          <p className="muted range">{rangeText(report)}</p>
          {report.count === 0 ? (
            <div className="empty">
              <p>No readings for this period.</p>
              <p className="muted">Add readings and they will show up here.</p>
            </div>
          ) : (
            <>
              <div className="stats">
                <Stat label="Highest" value={report.highest} unit="mg/dl" />
                <Stat label="Lowest" value={report.lowest} unit="mg/dl" />
                <Stat label="Average" value={report.average.toFixed(1)} unit="mg/dl" />
                <Stat label="Readings" value={report.count} />
              </div>
              {report.readings && (
                <ul className="day-list">
                  {report.readings.map((r) => (
                    <li key={r.id}>
                      <span>{r.slotLabel}</span>
                      <strong>{r.value} mg/dl</strong>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default function Reports({ refreshKey }) {
  const [date, setDate] = useState(todayString());
  const [results, setResults] = useState({}); // { daily: {report}|{error} }

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setResults({});
    REPORTS.forEach(async ({ type }) => {
      try {
        const report = await api.report(type, date);
        if (!cancelled) setResults((prev) => ({ ...prev, [type]: { report } }));
      } catch (err) {
        if (!cancelled) setResults((prev) => ({ ...prev, [type]: { error: err.message } }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, refreshKey]);

  return (
    <div>
      <div className="card toolbar">
        <label>
          Report date
          <input type="date" value={date} max={todayString()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <p className="muted">
          Daily shows this date. Month-to-date runs from the 1st of its month. Previous month covers the whole month before.
        </p>
      </div>

      <div className="reports-grid">
        {REPORTS.map(({ type, title }) => (
          <ReportCard
            key={type}
            title={title}
            report={results[type]?.report}
            error={results[type]?.error}
          />
        ))}
      </div>
    </div>
  );
}
