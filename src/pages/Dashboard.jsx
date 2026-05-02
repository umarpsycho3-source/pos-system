import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Dashboard.css';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="stat-card glass-panel">
    <div className="stat-header">
      <div className="stat-info"><h3>{title}</h3><h2>{value}</h2></div>
      <div className="stat-icon glass-card"><Icon size={24} className="text-primary" /></div>
    </div>
    <div className={`stat-trend ${trendUp ? 'text-success' : 'text-danger'}`}>
      <TrendingUp size={16} className={!trendUp ? 'rotate-180' : ''} />
      <span>{trend}</span>
    </div>
  </div>
);

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard() {
  const { currency, products, sales, todayRevenue, todayCost, todayProfit, todayOrders, monthlyRevenue, totalProfit } = useSettings();
  const lowStockProducts = products.filter((p) => Number(p.stock || 0) < 15);

  const revenueByDay = weekday.map((d) => ({ name: d, sales: 0, orders: 0 }));
  sales.forEach((s) => {
    const idx = new Date(s.createdAt).getDay();
    revenueByDay[idx].sales += Number(s.total || 0);
    if (s.type !== 'Return') revenueByDay[idx].orders += 1;
  });

  const displayMonthlyRevenue = Number(monthlyRevenue || 0);
  const displayTotalProfit = Number(totalProfit || 0);
  const displayTodayRevenue = Number(todayRevenue || 0);
  const displayTodayCost = Number(todayCost || 0);
  const displayTodayProfit = Number(todayProfit || 0);

  return (
    <div className="dashboard-container page-container">
      <div className="stats-grid">
        <StatCard title="Monthly Revenue" value={`${currency}${displayMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={DollarSign} trend="Net sales this month" trendUp />
        <StatCard title="Total Profit" value={`${currency}${displayTotalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={TrendingUp} trend="Sales minus costs (net)" trendUp />
        <StatCard title="Today's Revenue" value={`${currency}${displayTodayRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={DollarSign} trend="Net sales today" trendUp />
        <StatCard title="Today's Cost" value={`${currency}${displayTodayCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={DollarSign} trend="Cost of goods sold" trendUp />
        <StatCard title="Today's Profit" value={`${currency}${displayTodayProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={DollarSign} trend="Revenue - cost (today)" trendUp />
        <StatCard title="Today's Orders" value={todayOrders.toString()} icon={ShoppingBag} trend="Completed checkouts" trendUp />
      </div>

      <div className="charts-grid">
        <div className="chart-container glass-panel">
          <div className="chart-header"><h3>Revenue Overview</h3></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, '']} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container glass-panel">
          <div className="chart-header"><h3>Orders Trend</h3></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="glass-panel alerts-panel">
          <div className="chart-header flex-between"><h3>Low Stock Alerts</h3><span className="badge badge-danger">{lowStockProducts.length} Items</span></div>
          <div className="alerts-list">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="alert-item">
                <div className="alert-icon"><AlertCircle size={20} className="text-danger" /></div>
                <div className="alert-info"><h4>{product.name}</h4><p className="text-secondary">Barcode: {product.barcode}</p></div>
                <div className="alert-stock text-danger font-medium">Only {product.stock} left</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
