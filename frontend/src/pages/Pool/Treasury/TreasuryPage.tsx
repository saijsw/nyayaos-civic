import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePool } from "../../../context/PoolContext";
import { usePoolTreasury } from "../../../hooks/usePoolData";
import { recordContribution, recordExpense } from "../../../services/api";
import StatCard from "../../../components/UI/StatCard";

export default function TreasuryPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { isAdmin } = usePool();
  const { data: transactions, loading } = usePoolTreasury(poolId!, 50);

  const [showForm, setShowForm] = useState<"contribution" | "expense" | null>(null);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfter : 0;
  const totalIn = transactions.filter((t) => t.type === "contribution").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fn = showForm === "contribution" ? recordContribution : recordExpense;
      await fn({ poolId, amount: Number(amount), description: desc });
      setShowForm(null);
      setAmount("");
      setDesc("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2>Treasury</h2>
        {isAdmin && (
          <div className="flex gap-1">
            <button className="btn btn-accent" onClick={() => setShowForm("contribution")}>+ Contribution</button>
            <button className="btn btn-danger" onClick={() => setShowForm("expense")}>- Expense</button>
          </div>
        )}
      </div>

      <div className="grid-3 mb-2">
        <StatCard label="Current Balance" value={`₹${currentBalance.toLocaleString()}`} icon="💰" color="var(--accent)" />
        <StatCard label="Total Contributions" value={`₹${totalIn.toLocaleString()}`} icon="📥" />
        <StatCard label="Total Expenses" value={`₹${totalOut.toLocaleString()}`} icon="📤" color="var(--danger)" />
      </div>

      <div className="card">
        <h3 className="mb-1">Transaction Ledger</h3>
        {loading ? <p>Loading...</p> : transactions.length === 0 ? (
          <p className="text-muted">No transactions recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.txId}>
                  <td><span className={`badge ${tx.type === "contribution" ? "badge-active" : "badge-rejected"}`}>{tx.type}</span></td>
                  <td style={{ color: tx.amount >= 0 ? "var(--accent)" : "var(--danger)", fontWeight: 600 }}>
                    {tx.amount >= 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                  </td>
                  <td>{tx.description}</td>
                  <td>₹{tx.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ width: 400 }}>
            <h2 className="mb-2">Record {showForm === "contribution" ? "Contribution" : "Expense"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="label">Amount (₹)</label>
                <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className="label">Description</label>
                <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} required />
              </div>
              <div className="flex gap-1" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(null)}>Cancel</button>
                <button type="submit" className={`btn ${showForm === "contribution" ? "btn-accent" : "btn-danger"}`} disabled={submitting}>
                  {submitting ? "Saving..." : "Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
