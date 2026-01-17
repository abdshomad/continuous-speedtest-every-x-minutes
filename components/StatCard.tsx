
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, colorClass }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 transition-all hover:border-slate-500">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 font-medium text-sm tracking-wider uppercase">{label}</span>
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-xl`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-white">{value}</span>
        <span className="text-slate-400 font-medium">{unit}</span>
      </div>
    </div>
  );
};

export default StatCard;
