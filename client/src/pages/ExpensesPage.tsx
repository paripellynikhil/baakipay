import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Field, linkClass, primaryClass } from '../components/FormControls';
import { SkeletonList } from '../components/Skeletons';
import { Toast } from '../components/Toast';
import { useI18n } from '../i18n/I18n';
import { ApiError } from '../lib/api';
import {
  createExpense,
  listExpenses,
  markPaid,
  readCachedExpenses,
  removeExpense,
  type Expense,
} from '../lib/expensesApi';

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

interface AddExpenseModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddExpenseModal({ onClose, onSaved }: AddExpenseModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setFormError(t('bills.error'));
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      await createExpense({
        name: name.trim(),
        category: category.trim(),
        amount: amt,
        dueDate,
        notes: notes.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError && err.code === 'OFFLINE' ? t('networkError') : t('bills.error'));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-expense-title" className="mb-4 text-lg font-bold text-[#1E1B4B]">
          {t('bills.add')}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field
            id="exp-name"
            label={t('bills.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            required
          />

          <Field
            id="exp-category"
            label={t('bills.category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            autoComplete="off"
            required
          />

          <Field
            id="exp-amount"
            label={t('bills.amount')}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Field
            id="exp-due"
            label={t('bills.dueDate')}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <Field
            id="exp-notes"
            label={t('bills.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoComplete="off"
          />

          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

          <div className="mt-2 flex flex-col gap-2">
            <button type="submit" disabled={saving} className={primaryClass}>
              {t('bills.save')}
            </button>
            <button type="button" onClick={onClose} className={linkClass}>
              {t('bills.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ExpenseRowProps {
  expense: Expense;
  busy: boolean;
  onMarkPaid: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function ExpenseRow({ expense, busy, onMarkPaid, onDelete }: ExpenseRowProps) {
  const { t } = useI18n();
  const isPaid = expense.status === 'paid';

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#1E1B4B]">{expense.name}</p>
        <p className="text-xs text-slate-500">
          {expense.category} · {expense.dueDate}
        </p>
        {expense.notes && <p className="truncate text-xs text-slate-500">{expense.notes}</p>}
        {isPaid && expense.paidAt && (
          <p className="text-xs text-slate-500">
            {t('bills.paidOn')} {expense.paidAt.slice(0, 10)}
          </p>
        )}
      </div>
      <p className="shrink-0 font-bold text-slate-900">₹{formatAmount(expense.amount)}</p>
      {!isPaid && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onMarkPaid(expense)}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-[#16A34A] px-3 text-sm font-bold text-white disabled:opacity-60"
        >
          <Check size={16} aria-hidden="true" />
          {t('bills.markPaid')}
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(expense)}
        aria-label={t('bills.delete')}
        title={t('bills.delete')}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-[#DC2626] disabled:opacity-60"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </li>
  );
}

export default function ExpensesPage() {
  const { t } = useI18n();
  // Show the cached list straight away; the live fetch replaces it when it lands.
  const [expenses, setExpenses] = useState<Expense[]>(() => readCachedExpenses() ?? []);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    try {
      const res = await listExpenses();
      setExpenses(res.data);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () => expenses.filter((e) => e.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [expenses],
  );
  const paid = useMemo(() => expenses.filter((e) => e.status === 'paid'), [expenses]);
  const totalDue = useMemo(() => upcoming.reduce((sum, e) => sum + e.amount, 0), [upcoming]);

  async function handleMarkPaid(expense: Expense) {
    setBusyId(expense.id);
    try {
      await markPaid(expense.id);
      setToast(t('bills.markedPaid'));
      await load();
    } catch (err) {
      setToast(err instanceof ApiError && err.code === 'OFFLINE' ? t('networkError') : t('bills.error'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(expense: Expense) {
    setPendingDelete(null);
    setBusyId(expense.id);
    try {
      await removeExpense(expense.id);
      await load();
    } catch (err) {
      setToast(err instanceof ApiError && err.code === 'OFFLINE' ? t('networkError') : t('bills.error'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaved() {
    setAdding(false);
    await load();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#1E1B4B]">{t('bills.title')}</h1>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A]"
        >
          <Plus size={18} aria-hidden="true" />
          {t('bills.add')}
        </button>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
        <p className="text-sm font-semibold text-slate-500">{t('bills.totalDue')}</p>
        <p className="text-2xl font-bold text-[#1E1B4B]">₹{formatAmount(totalDue)}</p>
      </div>

      {loadFailed && expenses.length === 0 && (
        <p role="alert" className="text-sm font-semibold text-[#DC2626]">
          {t('networkError')}
        </p>
      )}

      {loading && expenses.length === 0 ? (
        <SkeletonList />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('bills.upcoming')}</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">{t('bills.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcoming.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    busy={busyId === expense.id}
                    onMarkPaid={(e) => void handleMarkPaid(e)}
                    onDelete={(e) => setPendingDelete(e)}
                  />
                ))}
              </ul>
            )}
          </div>

          {paid.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('bills.paid')}</h2>
              <ul className="flex flex-col gap-2">
                {paid.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    busy={busyId === expense.id}
                    onMarkPaid={(e) => void handleMarkPaid(e)}
                    onDelete={(e) => setPendingDelete(e)}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {adding && <AddExpenseModal onClose={() => setAdding(false)} onSaved={() => void handleSaved()} />}
      {pendingDelete && (
        <ConfirmDeleteModal
          name={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete(pendingDelete)}
        />
      )}
      <Toast message={toast} onDone={dismissToast} />
    </section>
  );
}
