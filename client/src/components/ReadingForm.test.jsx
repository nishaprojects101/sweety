import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ReadingForm from './ReadingForm.jsx';
import { ApiError } from '../api.js';

async function fill(user, { slot, value }) {
  if (slot) await user.selectOptions(screen.getByLabelText(/time slot/i), slot);
  if (value !== undefined) await user.type(screen.getByLabelText(/glucose/i), String(value));
}

test('shows "Please enter a glucose value." when the value is empty', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ReadingForm onSubmit={onSubmit} />);

  await fill(user, { slot: 'morning' });
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test.each([39, 601])('rejects %i as out of range', async (value) => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ReadingForm onSubmit={onSubmit} />);

  await fill(user, { slot: 'morning', value });
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('rejects a decimal value', async () => {
  const user = userEvent.setup();
  render(<ReadingForm onSubmit={vi.fn()} />);

  await fill(user, { slot: 'morning', value: '120.5' });
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
});

test('requires a time slot', async () => {
  const user = userEvent.setup();
  render(<ReadingForm onSubmit={vi.fn()} />);

  await fill(user, { value: 120 });
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  expect(screen.getByText('Please choose a time slot.')).toBeInTheDocument();
});

test('submits a valid reading with a numeric value', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue();
  render(<ReadingForm onSubmit={onSubmit} />);

  await fill(user, { slot: 'after_lunch', value: 132 });
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ slot: 'after_lunch', value: 132 });
});

test('shows a server rule error (duplicate slot) next to the slot field', async () => {
  const user = userEvent.setup();
  const message = 'You already have an After lunch reading for this date.';
  const onSubmit = vi.fn().mockRejectedValue(new ApiError(message, 409, [{ field: 'slot', message }]));
  render(<ReadingForm onSubmit={onSubmit} />);

  await fill(user, { slot: 'after_lunch', value: 120 });
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  expect(await screen.findByText(message)).toBeInTheDocument();
});

test('editing pre-fills the form and shows Save changes', () => {
  render(
    <ReadingForm
      initial={{ id: 1, date: '2026-10-15', slot: 'morning', value: 99 }}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
    />
  );
  expect(screen.getByLabelText(/glucose/i)).toHaveValue(99);
  expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
});
