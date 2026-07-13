import json

def fix_leave_management():
    path = "src/pages/LeaveManagement.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update the filter for History table
    old_filter = 'leaveData.filter((l: any) => l.employee === "Tanvy Pandey")'
    new_filter = 'leaveData.filter((l: any) => l.employee === (session?.user?.user_metadata?.name || "Tanvy Pandey"))'
    content = content.replace(old_filter, new_filter)

    # 2. Add employeeName to metadata in newEmpNotification for handleApprove
    content = content.replace(
        """      metadata: {
        type: 'leave_approved',
        date: leaveDateFormatted
      }""",
        """      metadata: {
        type: 'leave_approved',
        date: leaveDateFormatted,
        employeeName: leaveObj.employee
      }"""
    )

    # 3. Add employeeName to metadata in newEmpNotification for handleReject
    content = content.replace(
        """      metadata: {
        type: 'leave_rejected',
        date: leaveDateFormatted
      }""",
        """      metadata: {
        type: 'leave_rejected',
        date: leaveDateFormatted,
        employeeName: leaveObj.employee
      }"""
    )

    # 4. Add employeeName to metadata in submitComment
    content = content.replace(
        """          metadata: {
            type: 'leave_commented',
            date: req.start,
            requestId: req.id
          }""",
        """          metadata: {
            type: 'leave_commented',
            date: req.start,
            requestId: req.id,
            employeeName: req.employee
          }"""
    )

    # 5. Add employeeName to metadata in handleEditComment
    content = content.replace(
        "metadata: { type: 'leave_commented', date: req.start, requestId: req.id }",
        "metadata: { type: 'leave_commented', date: req.start, requestId: req.id, employeeName: req.employee }"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_notification_bell():
    path = "src/components/dashboard/NotificationBell.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if "const visibleNotifications =" not in content:
        old_str = "  const unreadCount = notifications.filter((n) => n.unread).length;"
        new_str = """  const currentUserName = user?.user_metadata?.name || user?.name || "Tanvy Pandey";
  const visibleNotifications = isManager ? notifications : notifications.filter((n: any) => !n.metadata?.employeeName || n.metadata.employeeName === currentUserName);
  const unreadCount = visibleNotifications.filter((n) => n.unread).length;"""
        content = content.replace(old_str, new_str)
        
        content = content.replace("notifications.length === 0", "visibleNotifications.length === 0")
        content = content.replace("notifications.map((notification)", "visibleNotifications.map((notification)")
        content = content.replace("notifications.map((notif", "visibleNotifications.map((notif")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_leave_management()
fix_notification_bell()
print("Done")
