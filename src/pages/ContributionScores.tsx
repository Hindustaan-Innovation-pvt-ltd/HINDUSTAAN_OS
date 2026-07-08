import React from 'react';
import { Trophy, Star, Medal, Zap, Award, Flame } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LEADERBOARD = [
  { rank: 1, name: 'Tanvy', initials: 'TP', role: 'Frontend Developer', score: 1250, streak: 12, trend: 'up', badge: 'Bug Squasher' },
  { rank: 2, name: 'Rahul Sharma', initials: 'RS', role: 'Backend Developer', score: 1120, streak: 8, trend: 'up', badge: 'Night Owl' },
  { rank: 3, name: 'Amanda Smith', initials: 'AS', role: 'UI/UX Designer', score: 980, streak: 5, trend: 'down', badge: 'Pixel Perfect' },
  { rank: 4, name: 'Priya Patel', initials: 'PP', role: 'Product Manager', score: 850, streak: 15, trend: 'up', badge: 'Visionary' },
  { rank: 5, name: 'Aakash Gupta', initials: 'AG', role: 'Engineering Manager', score: 720, streak: 2, trend: 'down', badge: 'Reviewer' },
];

export default function ContributionScores({ session }: { session?: any }) {
  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Contribution Leaderboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recognizing top performers in the current sprint.</p>
        </div>
      </div>

      {/* Podium (Top 3) */}
      <div className="flex items-end justify-center gap-4 sm:gap-8 mb-12 h-64 mt-10">
        {/* Rank 2 */}
        <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500 delay-100">
          <Avatar className="h-16 w-16 mb-4 ring-4 ring-slate-200 dark:ring-slate-700 shadow-xl">
            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xl">{LEADERBOARD[1].initials}</AvatarFallback>
          </Avatar>
          <div className="w-24 sm:w-32 h-32 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-lg border border-slate-200 dark:border-slate-600 border-b-0">
            <span className="text-3xl font-black text-slate-400 dark:text-slate-500">2</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">{LEADERBOARD[1].score} pts</span>
          </div>
        </div>

        {/* Rank 1 */}
        <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-500 z-10">
          <div className="relative mb-4">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <Star className="h-8 w-8 text-amber-400 fill-amber-400 drop-shadow-md" />
            </div>
            <Avatar className="h-20 w-20 ring-4 ring-amber-400 shadow-2xl">
              <AvatarFallback className="bg-amber-100 text-amber-700 font-black text-2xl">{LEADERBOARD[0].initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="w-28 sm:w-36 h-40 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-xl border border-amber-400 border-b-0">
            <span className="text-4xl font-black text-amber-100 drop-shadow-sm">1</span>
            <span className="text-sm font-black text-white mt-2">{LEADERBOARD[0].score} pts</span>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-200">
          <Avatar className="h-16 w-16 mb-4 ring-4 ring-amber-700/50 shadow-xl">
            <AvatarFallback className="bg-amber-900/20 text-amber-700 dark:text-amber-500 font-black text-xl">{LEADERBOARD[2].initials}</AvatarFallback>
          </Avatar>
          <div className="w-24 sm:w-32 h-24 bg-gradient-to-t from-amber-900/20 to-amber-800/10 dark:from-amber-900/40 dark:to-amber-900/20 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-lg border border-amber-900/20 dark:border-amber-700/50 border-b-0">
            <span className="text-3xl font-black text-amber-700/50 dark:text-amber-600/50">3</span>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-500 mt-2">{LEADERBOARD[2].score} pts</span>
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex-1 max-w-4xl mx-auto w-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">All Contributors</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {LEADERBOARD.map((user, i) => (
            <div key={i} className="flex items-center p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
              
              <div className="w-12 text-center">
                <span className="text-lg font-black text-slate-400 dark:text-slate-600">#{user.rank}</span>
              </div>
              
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-sm mx-4">
                <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-sm">{user.initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">{user.name}</h4>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>

              <div className="hidden sm:flex items-center gap-6 mr-8">
                <div className="flex items-center gap-1.5" title="Current Streak">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.streak} days</span>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-bold">
                  <Award className="h-3 w-3 mr-1" /> {user.badge}
                </Badge>
              </div>
              
              <div className="text-right">
                <span className="text-xl font-black text-slate-900 dark:text-white">{user.score}</span>
                <span className="text-xs font-bold text-slate-400 block -mt-1">pts</span>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
