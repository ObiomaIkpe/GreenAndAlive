import React from 'react';
import { BarChart3, PieChart, Activity, Calendar } from 'lucide-react';

export default function Analytics() {
  const monthlyData = [
    { month: 'Jan', emissions: 45, offsets: 38, net: 7 },
    { month: 'Feb', emissions: 42, offsets: 41, net: 1 },
    { month: 'Mar', emissions: 48, offsets: 45, net: 3 },
    { month: 'Apr', emissions: 41, offsets: 47, net: -6 },
    { month: 'May', emissions: 39, offsets: 52, net: -13 },
    { month: 'Jun', emissions: 37, offsets: 48, net: -11 }
  ];

  const maxValue = Math.max(...monthlyData.flatMap(d => [d.emissions, d.offsets]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Carbon Analytics</h2>
            <p className="text-gray-600">Track your carbon footprint and offset performance</p>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200">
              <Calendar className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Emissions vs Offsets */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Performance</h3>
              <p className="text-sm text-gray-600">Emissions vs Carbon Offsets</p>
            </div>
          </div>

          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{data.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-red-600">Emissions: {data.emissions}t</span>
                    <span className="text-xs text-green-600">Offsets: {data.offsets}t</span>
                    <span className={`text-xs font-medium ${data.net > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Net: {data.net > 0 ? '+' : ''}{data.net}t
                    </span>
                  </div>
                </div>
                <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-red-400 opacity-70"
                    style={{ width: `${(data.emissions / maxValue) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500"
                    style={{ width: `${(data.offsets / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-gray-600">Carbon Emissions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Carbon Offsets</span>
            </div>
          </div>
        </div>

        {/* Emission Sources Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Emission Sources</h3>
              <p className="text-sm text-gray-600">Breakdown by category</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { category: 'Electricity', percentage: 35, color: 'bg-yellow-500' },
              { category: 'Transportation', percentage: 28, color: 'bg-blue-500' },
              { category: 'Heating', percentage: 22, color: 'bg-red-500' },
              { category: 'Air Travel', percentage: 15, color: 'bg-purple-500' }
            ].map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  <span className="text-sm text-gray-600">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color} transition-all duration-1000`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carbon Intensity Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Carbon Intensity Trend</h3>
              <p className="text-sm text-gray-600">Daily carbon footprint over the last 30 days</p>
            </div>
          </div>

          <div className="relative h-40 flex items-end justify-between space-x-1">
            {Array.from({ length: 30 }, (_, i) => {
              const height = Math.random() * 80 + 20;
              const isWeekend = (i + 1) % 7 === 0 || (i + 1) % 7 === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t ${isWeekend ? 'bg-blue-400' : 'bg-emerald-400'} transition-all duration-300 hover:opacity-80`}
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded"></div>
              <span className="text-gray-600">Weekday Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="text-gray-600">Weekend Average</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-emerald-600 mb-1">-23%</div>
          <div className="text-sm text-gray-600">Reduction This Year</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">2.4</div>
          <div className="text-sm text-gray-600">Tons CO₂/Month</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">156</div>
          <div className="text-sm text-gray-600">Credits Purchased</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">94%</div>
          <div className="text-sm text-gray-600">Goal Achievement</div>
        </div>
      </div>
    </div>
  );
}