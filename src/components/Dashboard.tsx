import React from 'react';
import { Leaf, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { UserPortfolio } from '../types';

interface Props {
  portfolio: UserPortfolio;
}

export default function Dashboard({ portfolio }: Props) {
  const progressPercentage = Math.min((portfolio.monthlyOffset / portfolio.reductionGoal) * 100, 100);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Total Credits</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{portfolio.totalCredits.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-sm text-emerald-600 font-medium">+12% this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Portfolio Value</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">${portfolio.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-sm text-blue-600 font-medium">+8.2% this week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Monthly Offset</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{portfolio.monthlyOffset} tons</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 mt-1 block">
              {progressPercentage.toFixed(1)}% of monthly goal
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Carbon Footprint</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{portfolio.carbonFootprint} tons</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-sm text-orange-600 font-medium">-15% vs last month</span>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainability Progress</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Carbon Neutral Goal</span>
            <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 tons</span>
            <span>{portfolio.reductionGoal} tons</span>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
        <div className="space-y-3">
          {portfolio.achievements.map((achievement, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
              <div className="bg-emerald-500 p-1 rounded-full flex-shrink-0 mt-0.5">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-emerald-800 leading-relaxed">{achievement}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}