import React, { useState } from 'react';
import { User, Award, Target, Settings, Bell, Shield } from 'lucide-react';

export default function Profile() {
  const [activeSection, setActiveSection] = useState('overview');

  const achievements = [
    { title: 'Carbon Neutral Champion', description: 'Achieved carbon neutrality for 3 consecutive months', date: '2024-03-15', badge: '🏆' },
    { title: 'Forest Protector', description: 'Purchased 100+ forest conservation credits', date: '2024-02-28', badge: '🌳' },
    { title: 'Efficiency Expert', description: 'Reduced emissions by 30% through efficiency improvements', date: '2024-01-20', badge: '⚡' },
    { title: 'Green Investor', description: 'Invested in renewable energy credits worth $5,000+', date: '2024-01-05', badge: '💚' }
  ];

  const goals = [
    { title: 'Carbon Neutral by 2025', progress: 78, target: '0 net emissions', deadline: '2025-01-01' },
    { title: 'Reduce Footprint by 50%', progress: 45, target: '15 tons CO₂/year', deadline: '2024-12-31' },
    { title: 'Offset 1000 Credits', progress: 67, target: '1000 credits purchased', deadline: '2024-06-30' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-green-600 rounded-t-xl">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <User className="w-12 h-12 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="pt-16 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Alex Johnson</h2>
              <p className="text-gray-600">Sustainability Manager at EcoTech Corp</p>
              <p className="text-sm text-gray-500 mt-1">Member since January 2023</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors duration-200">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Impact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                      <div>
                        <p className="font-medium text-emerald-900">Total CO₂ Offset</p>
                        <p className="text-sm text-emerald-700">Lifetime achievement</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">247 tons</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900">Credits Purchased</p>
                        <p className="text-sm text-blue-700">Total investments</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">156</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium text-purple-900">Sustainability Score</p>
                        <p className="text-sm text-purple-700">AI-calculated rating</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">A+</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                  <div className="space-y-3">
                    {[
                      { action: 'Purchased forest conservation credits', time: '2 hours ago', type: 'purchase' },
                      { action: 'Completed monthly carbon assessment', time: '1 day ago', type: 'assessment' },
                      { action: 'Updated sustainability goals', time: '3 days ago', type: 'update' },
                      { action: 'Received AI recommendation', time: '5 days ago', type: 'ai' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'purchase' ? 'bg-emerald-500' :
                          activity.type === 'assessment' ? 'bg-blue-500' :
                          activity.type === 'update' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'achievements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{achievement.badge}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-2">Earned on {new Date(achievement.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'goals' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Sustainability Goals</h3>
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <span className="text-sm text-gray-500">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Target: {goal.target}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates about your carbon activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add extra security to your account</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200">
                    Enable
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Data & Privacy</h4>
                  <div className="space-y-2">
                    <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                      Download your data
                    </button>
                    <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                      Privacy policy
                    </button>
                    <button className="block text-sm text-red-600 hover:text-red-700 transition-colors duration-200">
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}