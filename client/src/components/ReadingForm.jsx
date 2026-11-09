import { useState } from 'react';
import { SLOTS, todayString } from '../constants.js';
import { validateReading } from '../validation.js';

/**
 * Used for adding a new reading and for editing an existing one.
 * `onSubmit(values)` should return a promise; if it throws an ApiError,
 * the message is shown next to the field it belongs to.
 */
export default function ReadingForm({ initial, onSubmit, onCancel }) {
  const editing = Boolean(initial);
  const [values, setValues] = useState({
    date: initial?.date ?? todayString(),
    slot: initial?.slot ?? '',
    value: initial?.value ?? '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const found = validateReading(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await onSubmit({ ...values, value: Number(values.value) });
      if (!editing) setValues({ ...values, slot: '', value: '' });
    } catch (err) {
      // Show server messages beside the right field when we know which one it is.
      const fieldErrors = {};
      for (const { field, message } of err.errors ?? []) {
        if (field) fieldErrors[field] = message;
      }
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="reading-form">
      <div className="row">
        <label>
          Date
          <input type="date" value={values.date} max={todayString()} onChange={set('date')} />
          {errors.date && <span className="error" role="alert">{errors.date}</span>}
        </label>

        <label>
          Time slot
          <select value={values.slot} onChange={set('slot')}>
            <option value="">Select…</option>
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {errors.slot && <span className="error" role="alert">{errors.slot}</span>}
        </label>

        <label>
          Glucose (mg/dl)
          <input
            type="number"
            inputMode="numeric"
            value={values.value}
            onChange={set('value')}
            placeholder="e.g. 110"
          />
          {errors.value && <span className="error" role="alert">{errors.value}</span>}
        </label>
      </div>

      {formError && <p className="error" role="alert">{formError}</p>}

      <div className="actions">
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Add reading'}
        </button>
        {editing && (
          <button type="button" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
