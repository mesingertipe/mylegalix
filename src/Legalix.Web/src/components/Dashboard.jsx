import React, { useState } from 'react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar glass-morphism">
        <div className="logo mb-8" style={{ fontSize: '1.25rem', fontWeight: 800 }}>LEGALIX.</div>
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`text-left p-2 rounded ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
          >
            Resumen
          </button>
          <button 
            onClick={() => setActiveTab('tenants')}
            className={`text-left p-2 rounded ${activeTab === 'tenants' ? 'bg-accent text-white font-bold' : 'text-text-muted hover:text-white'}`}
          >
            Súper Admin: Tenants
          </button>
          <hr className="border-white/10 my-2" />
          <button 
            onClick={() => setActiveTab('employees')}
            className={`text-left p-2 rounded ${activeTab === 'employees' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
          >
            Tarjetas de Empleados
          </button>
          <button 
            onClick={() => setActiveTab('areas')}
            className={`text-left p-2 rounded ${activeTab === 'areas' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
          >
             Líderes y Áreas
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`text-left p-2 rounded ${activeTab === 'users' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
          >
            Gestión de Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`text-left p-2 rounded ${activeTab === 'audit' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
          >
            Auditoría
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`text-left p-2 rounded ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
          >
            Configuración
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content w-full">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Dashboard Admin</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">Admin: Juan Pérez</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary"></div>
          </div>
        </header>

        {activeTab === 'overview' && <Overview />}
        {activeTab === 'tenants' && <TenantManagement />}
        {activeTab === 'employees' && <EmployeeList />}
        {activeTab === 'areas' && <AreaManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'audit' && <ExpenseAudit />}
        {activeTab === 'settings' && <Configuration />}
      </main>
    </div>
  );
};

const Overview = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="glass-morphism p-6 rounded-2xl">
      <p className="card-title">Total Legalizado</p>
      <p className="card-value">$45.280.000</p>
      <p className="text-success text-xs mt-2">+12% vs mes anterior</p>
    </div>
    <div className="glass-morphism p-6 rounded-2xl">
      <p className="card-title">Cupos Disponibles</p>
      <p className="card-value">$12.400.000</p>
      <p className="text-text-muted text-xs mt-2">60% del cupo total asignado</p>
    </div>
    <div className="glass-morphism p-6 rounded-2xl">
      <p className="card-title">Pendientes de Revisión</p>
      <p className="card-value">18</p>
      <p className="text-warning text-xs mt-2">Acción requerida inmediata</p>
    </div>
  </div>
);

const EmployeeList = () => {
    const employees = [
        { id: 1, name: "Carlos Ruiz", card: "**** 4521", status: "Active", balance: "$1.200.000" },
        { id: 2, name: "Marta Gómez", card: "**** 8892", status: "Active", balance: "$450.000" },
        { id: 3, name: "Luis Prada", card: "**** 1022", status: "Paused", balance: "$0" },
    ];

    return (
        <div className="glass-morphism p-6 rounded-2xl mt-8">
            <h3 className="text-xl font-bold mb-4">Gestión de Empleados</h3>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Tarjeta</th>
                        <th>Estado</th>
                        <th>Cupo Disponible</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                        <tr key={emp.id}>
                            <td>{emp.name}</td>
                            <td>{emp.card}</td>
                            <td><span className={`status-badge ${emp.status === 'Active' ? 'status-approved' : 'status-rejected'}`}>{emp.status}</span></td>
                            <td>{emp.balance}</td>
                            <td><button className="text-primary text-xs hover:underline">Gestionar</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ExpenseAudit = () => {
    const expenses = [
        { id: 1, merchant: "Crepes & Waffles", date: "2024-03-15", amount: "$54.000", tax: "$8.621", status: "Pending" },
        { id: 2, merchant: "Hotel Estelar", date: "2024-03-14", amount: "$320.000", tax: "$60.800", status: "Pending" },
    ];

    return (
        <div className="glass-morphism p-6 rounded-2xl mt-8">
             <h3 className="text-xl font-bold mb-4">Auditoría de Gastos</h3>
             <table>
                <thead>
                    <tr>
                        <th>Comercio</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>IVA</th>
                        <th>Estado</th>
                        <th>Validación Fiscal</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map(exp => (
                        <tr key={exp.id}>
                            <td>{exp.merchant}</td>
                            <td>{exp.date}</td>
                            <td>{exp.amount}</td>
                            <td>{exp.tax}</td>
                            <td><span className="status-badge status-pending">{exp.status}</span></td>
                            <td><span className="text-success text-xs">✓ Validada</span></td>
                            <td className="flex gap-2">
                                <button className="bg-success/20 text-success p-1 px-3 rounded text-xs">Aprobar</button>
                                <button className="bg-danger/20 text-danger p-1 px-3 rounded text-xs">Rechazar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const UserManagement = () => {
    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Usuarios del Sistema</h3>
                <button className="cta-button">Nuevo Usuario</button>
            </div>
            <div className="glass-morphism p-6 rounded-2xl">
                <table>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Último Acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Juan Pérez</td>
                            <td>juan.perez@empresa.com</td>
                            <td><span className="p-1 px-3 bg-secondary/20 text-secondary rounded-full text-xs">Admin</span></td>
                            <td>Hoy, 10:45 AM</td>
                            <td><button className="text-primary text-xs hover:underline">Editar</button></td>
                        </tr>
                        <tr>
                            <td>Ana Martínez</td>
                            <td>ana.m@empresa.com</td>
                            <td><span className="p-1 px-3 bg-primary/20 text-primary rounded-full text-xs">Empleado</span></td>
                            <td>Ayer, 3:20 PM</td>
                            <td><button className="text-primary text-xs hover:underline">Editar</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Configuration = () => {
    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-morphism p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-6">Configuración de Empresa</h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Nombre Legal</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 p-2 rounded" defaultValue="Mi Empresa S.A.S" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">NIT</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 p-2 rounded" defaultValue="900.123.456-1" />
                    </div>
                    <button className="cta-button mt-4">Guardar Cambios</button>
                </div>
            </div>
            
            <div className="glass-morphism p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-6">Políticas de Gasto</h3>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Exigir validación fiscal inmediata</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Permitir gastos sin conexión</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Límite diario por empleado</span>
                        <input type="number" className="bg-white/5 border border-white/10 p-1 rounded w-24" defaultValue="500000" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const TenantManagement = () => (
    <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Administración de Tenants (Empresas)</h3>
            <button className="cta-button" style={{ background: 'var(--accent)' }}>Crear Nueva Empresa</button>
        </div>
        <div className="glass-morphism p-6 rounded-2xl">
            <table>
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>NIT</th>
                        <th>Usuarios</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Logística Express S.A.</td>
                        <td>900.555.222-1</td>
                        <td>45</td>
                        <td><span className="status-badge status-approved">Activo</span></td>
                        <td><button className="text-accent text-xs hover:underline">Suspender</button></td>
                    </tr>
                    <tr>
                        <td>Alimentos del Norte</td>
                        <td>860.111.000-4</td>
                        <td>12</td>
                        <td><span className="status-badge status-approved">Activo</span></td>
                        <td><button className="text-accent text-xs hover:underline">Suspender</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

const AreaManagement = () => (
    <div className="mt-8">
        <h3 className="text-xl font-bold mb-6">Áreas y Presupuestos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-morphism p-6 rounded-2xl">
                <div className="flex justify-between mb-4">
                    <h4 className="font-bold">Ventas Nacional</h4>
                    <span className="text-xs text-text-muted">Líder: Carlos Ruiz</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full mb-2">
                    <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Usado: $7.500.000</span>
                    <span className="text-text-muted">Meta: $10.000.000</span>
                </div>
            </div>
            <div className="glass-morphism p-6 rounded-2xl">
                <div className="flex justify-between mb-4">
                    <h4 className="font-bold">Mantenimiento</h4>
                    <span className="text-xs text-text-muted">Líder: Marta Gómez</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full mb-2">
                    <div className="bg-warning h-full rounded-full" style={{ width: '95%' }}></div>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-warning">Usado: $4.750.000</span>
                    <span className="text-text-muted">Meta: $5.000.000</span>
                </div>
            </div>
        </div>
    </div>
);

export default Dashboard;
