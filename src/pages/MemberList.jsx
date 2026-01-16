import React, { useState, useEffect } from 'react';
import { getMembers, saveMember, deleteMember, removeMember } from '../services/MemberService';
import { useAuth } from '../context/AuthContext';
import { Pencil } from 'lucide-react';
import MemberCard from '../components/MemberCard';
import MemberForm from '../components/MemberForm';
import './MemberList.css';

const MemberList = () => {
    const { user, canManageMembers, canAccessTreasury } = useAuth();
    const [members, setMembers] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, inactive

    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'memberNumber', direction: 'asc' });

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoading(true);
        const data = await getMembers();
        setMembers(data);
        setLoading(false);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSave = async (memberData) => {
        await saveMember(user, memberData);
        setIsAdding(false);
        setEditingMember(null);
        await loadMembers();
    };

    const filteredAndSortedMembers = [...members]
        .filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                (m.memberNumber && m.memberNumber.includes(search));
            const matchesFilter = filter === 'all' ||
                (filter === 'active' && m.status !== 'inactive') ||
                (filter === 'inactive' && m.status === 'inactive');
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    const handleDelete = async (memberId) => {
        await deleteMember(user, memberId);
        setIsAdding(false);
        setEditingMember(null);
        await loadMembers();
    };

    const handleRemove = async (memberId) => {
        await removeMember(user, memberId);
        setIsAdding(false);
        setEditingMember(null);
        await loadMembers();
    };

    if (isAdding || editingMember) {
        return (
            <div className="container">
                <MemberForm
                    member={editingMember}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onRemove={handleRemove}
                    onCancel={() => { setIsAdding(false); setEditingMember(null); }}
                />
            </div>
        );
    }

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
    };

    return (
        <div className="member-list-page container">
            <div className="page-header">
                <h1>Socios</h1>
                <p>{members.length} socios registrados</p>
            </div>

            <div className="list-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-box">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Bajas</option>
                    </select>
                </div>

                {canManageMembers && (
                    <button className="btn btn-primary add-btn" onClick={() => setIsAdding(true)}>
                        + Nuevo Socio
                    </button>
                )}
            </div>

            <div className="members-table-container card">
                {loading ? (
                    <div className="loading-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-color-light)' }}>
                        Cargando socios...
                    </div>
                ) : filteredAndSortedMembers.length > 0 ? (
                    <div className="table-wrapper">
                        <table className="members-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('memberNumber')} className="sortable">Nº {renderSortIcon('memberNumber')}</th>
                                    <th onClick={() => handleSort('name')} className="sortable">Nombre {renderSortIcon('name')}</th>
                                    <th onClick={() => handleSort('status')} className="sortable">Estado {renderSortIcon('status')}</th>
                                    {canAccessTreasury && <th onClick={() => handleSort('isPaid')} className="sortable">Pago {renderSortIcon('isPaid')}</th>}
                                    <th onClick={() => handleSort('role')} className="sortable">Rol {renderSortIcon('role')}</th>
                                    <th>Categoría</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedMembers.map(m => (
                                    <tr
                                        key={m.id}
                                        className={`${m.status === 'inactive' ? 'row-inactive' : ''} ${canManageMembers ? 'clickable-row' : ''}`}
                                        onClick={() => canManageMembers && setEditingMember(m)}
                                    >
                                        <td className="col-num">#{m.memberNumber}</td>
                                        <td className="col-name">
                                            <div className="name-with-photo">
                                                {m.photo ? (
                                                    <img src={m.photo} alt={m.name} className="mini-photo" />
                                                ) : (
                                                    <div className="mini-photo-placeholder">{m.name.charAt(0)}</div>
                                                )}
                                                <span>{m.name}</span>
                                            </div>
                                        </td>
                                        <td className="col-status">
                                            <span className={`status-badge ${m.status}`}>
                                                {m.status === 'active' ? 'Activo' : 'Baja'}
                                            </span>
                                        </td>
                                        {canAccessTreasury && (
                                            <td className="col-payment">
                                                {m.isPaid ? <span title="Pagado">✅</span> : <span title="Pendiente">❌</span>}
                                            </td>
                                        )}
                                        <td className="col-role">{m.role}</td>
                                        <td className="col-type">
                                            {m.type === 'junior' ? 'Junior' : 'Adulto'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-results">
                        No se han encontrado socios que coincidan con la búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberList;
