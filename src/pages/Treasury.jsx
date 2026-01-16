import React, { useState, useEffect } from 'react';
import { getMovements, saveMovement, deleteMovement, calculateTotals } from '../services/TreasuryService';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2 } from 'lucide-react';
import MovementForm from '../components/MovementForm';
import './Treasury.css';

const Treasury = () => {
    const { user } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [movements, setMovements] = useState([]);
    const [totals, setTotals] = useState({ initialBalance: 0, totalIncome: 0, totalExpenses: 0, balance: 0, monthly: [] });
    const [isAdding, setIsAdding] = useState(false);
    const [editingMovement, setEditingMovement] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // summary, movements

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allMovements = await getMovements();
            setMovements(allMovements.filter(m => new Date(m.date).getFullYear() === year));
            const totalsData = await calculateTotals(year);
            setTotals(totalsData);
        } catch (error) {
            console.error("Error loading treasury data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        await saveMovement(user, data);
        setIsAdding(false);
        setEditingMovement(null);
        await loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres borrar este movimiento?')) {
            await deleteMovement(user, id);
            await loadData();
        }
    };

    return (
        <div className="treasury-page container">
            <div className="page-header">
                <h1>Tesorería</h1>
                <div className="year-selector">
                    <button onClick={() => setYear(y => y - 1)}>◀</button>
                    <span>{year}</span>
                    <button onClick={() => setYear(y => y + 1)}>▶</button>
                </div>
            </div>

            <div className="treasury-tabs">
                <button
                    className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Resumen Anual
                </button>
                <button
                    className={`tab ${activeTab === 'movements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('movements')}
                >
                    Movimientos
                </button>
            </div>

            {loading ? (
                <div className="loading-state card">Cargando datos de tesorería...</div>
            ) : (
                isAdding || editingMovement ? (
                    <MovementForm
                        movement={editingMovement}
                        onSave={handleSave}
                        onCancel={() => { setIsAdding(false); setEditingMovement(null); }}
                    />
                ) : (
                    <>
                        {activeTab === 'summary' && (
                            <div className="summary-view">
                                <div className="totals-grid">

                                    <div className="total-card income">
                                        <span className="label">Ingresos Anuales</span>
                                        <span className="value">{totals.totalIncome.toFixed(2)}€</span>
                                    </div>
                                    <div className="total-card expense">
                                        <span className="label">Gastos Anuales</span>
                                        <span className="value">{totals.totalExpenses.toFixed(2)}€</span>
                                    </div>
                                    <div className="total-card balance">
                                        <span className="label">Balance en Cuenta</span>
                                        <span className={`value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
                                            {totals.balance.toFixed(2)}€
                                        </span>
                                    </div>
                                </div>

                                <div className="monthly-table card">
                                    <div className="table-header-row">
                                        <h3>Resumen Mensual</h3>
                                        <div className="initial-balance-display">
                                            <span className="label">Saldo Inicial Año:</span>
                                            <span className="value">{(totals.initialBalance || 0).toFixed(2)}€</span>
                                        </div>
                                    </div>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Mes</th>
                                                    <th>Ingresos</th>
                                                    <th>Gastos</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {totals.monthly.map((m, i) => (
                                                    <tr key={i}>
                                                        <td className="month-name">{m.month}</td>
                                                        <td className="income-cell">{m.income > 0 ? `+${m.income.toFixed(2)}€` : '-'}</td>
                                                        <td className="expense-cell">{m.expenses > 0 ? `-${m.expenses.toFixed(2)}€` : '-'}</td>
                                                        <td className={`total-cell ${m.total >= 0 ? 'positive' : 'negative'}`}>
                                                            {m.total.toFixed(2)}€
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'movements' && (
                            <div className="movements-view">
                                <div className="list-actions">
                                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                                        + Nuevo Movimiento
                                    </button>
                                </div>

                                <div className="movements-list">
                                    {movements.sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => (
                                        <div key={m.id} className="movement-item card">
                                            <div className="m-date">{new Date(m.date).toLocaleDateString()}</div>
                                            <div className="m-info">
                                                <div className="m-concept">{m.concept}</div>
                                                <div className="m-type">{m.type === 'income' ? 'Ingreso' : 'Gasto'}</div>
                                            </div>
                                            <div className={`m-amount ${m.type}`}>
                                                {m.type === 'income' ? '+' : '-'}{parseFloat(m.amount).toFixed(2)}€
                                            </div>
                                            <div className="m-actions">
                                                <button onClick={() => setEditingMovement(m)} title="Editar"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(m.id)} title="Borrar"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {movements.length === 0 && (
                                        <div className="no-results card">No hay movimientos registrados en este año.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    );
};

export default Treasury;
