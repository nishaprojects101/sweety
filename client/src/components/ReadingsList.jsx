import { useState } from 'react';
import { api } from '../api.js';
import { formatDate } from '../constants.js';
import ReadingForm from './ReadingForm.jsx';

export default function ReadingsList({ data, onChanged, onPage }) {
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function handleDelete(r) {
    if (!window.confirm(`Delete the ${r.slotLabel} reading of ${r.value} mg/dl on ${formatDate(r.date)}?`)) return;
    setError('');
    try {
      await api.deleteReading(r.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(r, values) {
    await api.updateReading(r.id, values);
    setEditingId(null);
    onChanged();
  }

  if (!data) return <p className="muted">Loading…</p>;

  if (data.readings.length === 0) {
    return (
      <div className="empty">
        <p>No readings yet.</p>
        <p className="muted">Add your first reading above to get started.</p>
      </div>
    );
  }

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Slot</th>
            <th className="num">mg/dl</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.readings.map((r) =>
            editingId === r.id ? (
              <tr key={r.id}>
                <td colSpan={4}>
                  <ReadingForm
                    initial={r}
                    onSubmit={(values) => handleUpdate(r, values)}
                    onCancel={() => setEditingId(null)}
                  />
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>{r.slotLabel}</td>
                <td className="num"><strong>{r.value}</strong></td>
                <td className="row-actions">
                  <button type="button" onClick={() => setEditingId(r.id)}>Edit</button>
                  <button type="button" className="danger" onClick={() => handleDelete(r)}>Delete</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {data.totalPages > 1 && (
        <div className="pager">
          <button type="button" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>
            ← Newer
          </button>
          <span className="muted">Page {data.page} of {data.totalPages}</span>
          <button type="button" disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>
            Older →
          </button>
        </div>
      )}
    </>
  );
}
