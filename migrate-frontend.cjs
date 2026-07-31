const { Project } = require("ts-morph");

const project = new Project({
    tsConfigFilePath: "tsconfig.app.json",
});

const path = require("path");

// A helper function to move files if they exist
function moveFile(oldPath, newDir) {
    const file = project.getSourceFile(f => f.getFilePath().endsWith(oldPath));
    if (file) {
        const fileName = oldPath.split('/').pop();
        const newDirAbs = path.resolve(__dirname, newDir);
        console.log(`Moving ${oldPath} to ${newDir}/${fileName}`);
        file.moveToDirectory(newDirAbs);
    } else {
        console.warn(`Warning: Could not find ${oldPath}`);
    }
}

async function run() {
    console.log("Starting migration...");

    // App/Global
    moveFile("src/App.tsx", "src/app");
    moveFile("src/main.tsx", "src/app");
    moveFile("src/ErrorBoundary.tsx", "src/app");
    
    // Auth Module
    moveFile("src/pages/Login.tsx", "src/features/auth/pages");
    moveFile("src/pages/Register.tsx", "src/features/auth/pages");
    moveFile("src/pages/Logout.tsx", "src/features/auth/pages");

    // Dashboard Module
    moveFile("src/pages/AdminDashboard.tsx", "src/features/dashboard/pages");
    moveFile("src/pages/OverviewDashboard.tsx", "src/features/dashboard/pages");
    moveFile("src/pages/ManagerDashboard.tsx", "src/features/dashboard/pages");
    moveFile("src/pages/InternDashboard.tsx", "src/features/dashboard/pages");
    moveFile("src/components/dashboard/MyTasksWidget.tsx", "src/features/dashboard/components");
    moveFile("src/components/dashboard/GlobalSearch.tsx", "src/features/dashboard/components");
    moveFile("src/components/dashboard/EmployeeNotificationsWidget.tsx", "src/features/dashboard/components");
    moveFile("src/components/dashboard/worklogs/TotalWorklogsWidget.tsx", "src/features/dashboard/components/worklogs");
    moveFile("src/components/dashboard/RoleBasedRoute.tsx", "src/features/dashboard/components");

    // Tasks Module
    moveFile("src/pages/TaskBoard.tsx", "src/features/tasks/pages");
    moveFile("src/components/dashboard/TaskDetailsModal.tsx", "src/features/tasks/components");
    moveFile("src/components/dashboard/CreateTaskModal.tsx", "src/features/tasks/components");
    moveFile("src/components/dashboard/AssignTaskDialog.tsx", "src/features/tasks/components");

    // Projects Module
    moveFile("src/pages/Projects.tsx", "src/features/projects/pages");
    moveFile("src/pages/GanttTimeline.tsx", "src/features/projects/pages");
    moveFile("src/pages/Milestones.tsx", "src/features/projects/pages");
    moveFile("src/components/dashboard/ProjectCalendar.tsx", "src/features/projects/components");
    moveFile("src/components/projects/ProjectDetailsDialog.tsx", "src/features/projects/components");

    // Leaves/HR Module
    moveFile("src/pages/LeaveManagement.tsx", "src/features/leaves/pages");
    moveFile("src/pages/TimeAndStandup.tsx", "src/features/leaves/pages");
    moveFile("src/pages/WorkLogs.tsx", "src/features/leaves/pages");
    moveFile("src/pages/DailyStandups.tsx", "src/features/leaves/pages");
    moveFile("src/pages/ProgressTracker.tsx", "src/features/leaves/pages");
    moveFile("src/pages/ProgressPage.tsx", "src/features/leaves/pages");
    moveFile("src/pages/ContributionScores.tsx", "src/features/leaves/pages");

    moveFile("src/components/dashboard/LeaveApplicationDialog.tsx", "src/features/leaves/components");
    moveFile("src/components/dashboard/LeaveCalendarWidget.tsx", "src/features/leaves/components");
    moveFile("src/components/manager/LeaveRequestDialog.tsx", "src/features/leaves/components");
    moveFile("src/components/dashboard/EmployeeCalendar.tsx", "src/features/leaves/components");
    moveFile("src/components/dashboard/TrainingCalendar.tsx", "src/features/leaves/components");
    moveFile("src/components/attendance/AttendanceHistory.tsx", "src/features/leaves/components");

    // Team/Profiles Module
    moveFile("src/pages/TeamMembers.tsx", "src/features/team/pages");
    moveFile("src/pages/ProfileView.tsx", "src/features/team/pages");
    moveFile("src/pages/ProfileEdit.tsx", "src/features/team/pages");
    moveFile("src/pages/EmployeeProfileView.tsx", "src/features/team/pages");
    moveFile("src/pages/EmployeeProfileEdit.tsx", "src/features/team/pages");
    moveFile("src/components/profile/AvatarUpload.tsx", "src/features/team/components");

    // Communications Module
    moveFile("src/components/dashboard/WhatsAppBroadcast.tsx", "src/features/communications/components");
    moveFile("src/components/dashboard/NotificationCenter.tsx", "src/features/communications/components");

    // Workspace/Settings Module
    moveFile("src/pages/Settings.tsx", "src/features/workspace/pages");
    moveFile("src/pages/SecuritySettings.tsx", "src/features/workspace/pages");
    moveFile("src/pages/Subscriptions.tsx", "src/features/workspace/pages");
    moveFile("src/pages/RolesAndPermissions.tsx", "src/features/workspace/pages");
    moveFile("src/pages/workspace/WorkspaceSettings.tsx", "src/features/workspace/pages");
    
    // workspace-settings components
    moveFile("src/components/workspace-settings/GeneralSettings.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/SecuritySettings.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/NotificationSettings.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/EmailSettings.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/AppearanceSettings.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/ProjectSettings.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/SystemLogs.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/ActiveSessions.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/Announcements.tsx", "src/features/workspace/components");
    moveFile("src/components/workspace-settings/DeleteWorkspace.tsx", "src/features/workspace/components");

    // Static pages
    moveFile("src/pages/AboutUs.tsx", "src/features/pages");
    moveFile("src/pages/HelpSupport.tsx", "src/features/pages");

    // Save all changes
    console.log("Saving changes... (this will update all relative imports automatically!)");
    await project.save();
    console.log("Migration complete!");
}

run().catch(err => {
    console.error("Migration failed:", err);
});
