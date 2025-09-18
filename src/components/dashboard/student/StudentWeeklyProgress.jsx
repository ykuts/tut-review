import React from 'react';
import WeeklyProgress from '../WeeklyProgress';

/**
 * Student-specific wrapper for WeeklyProgress component
 * This allows us to customize student weekly progress in the future
 */
const StudentWeeklyProgress = ({ weeklySchedule, weeklyProgress, weeklyGoal }) => {
  return (
    <WeeklyProgress
      weeklySchedule={weeklySchedule}
      weeklyProgress={weeklyProgress}
      weeklyGoal={weeklyGoal}
    />
  );
};

export default StudentWeeklyProgress;