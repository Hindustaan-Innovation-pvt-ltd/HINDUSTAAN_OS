import re

path = 'src/pages/LeaveManagement.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the main TabsList for Manager
tabs_trigger_start = content.find('{!isManager ? (')
tabs_trigger_end = content.find('</TabsList>')

if tabs_trigger_start != -1 and tabs_trigger_end != -1:
    old_tabs_block = content[tabs_trigger_start:tabs_trigger_end]
    new_tabs_block = """{!isManager ? (
            <>
              <TabsTrigger value="apply" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Apply Leave</TabsTrigger>
              <TabsTrigger value="history" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">My History</TabsTrigger>
              <TabsTrigger value="balance" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Leave Balance</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="requests" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">
                Pending Requests ({leaveData.filter((l: any) => l.status === 'Pending').length})
              </TabsTrigger>
              <TabsTrigger value="history" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">
                Leave History ({leaveData.filter((l: any) => l.status !== 'Pending').length})
              </TabsTrigger>
              <TabsTrigger value="calendar" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">
                Team Calendar
              </TabsTrigger>
            </>
          )}
        """
    content = content.replace(old_tabs_block, new_tabs_block)


# 2. Update TabsContent for Manager
# Remove the sub-tabs from "requests" and split into two TabsContent
manager_req_start = content.find('{/* Manager: Team Requests */}')
manager_cal_start = content.find('{/* Manager: Team Calendar */}')

if manager_req_start != -1 and manager_cal_start != -1:
    old_manager_req_block = content[manager_req_start:manager_cal_start]
    
    new_manager_req_block = """{/* Manager: Team Requests */}
          {isManager && (
            <TabsContent value="requests">
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {leaveData.filter((l: any) => l.status === 'Pending').length === 0 ? (
                      <motion.div key="empty-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                          <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">All Caught Up!</h3>
                        <p className="text-slate-500 font-medium">There are no pending leave requests to approve.</p>
                      </motion.div>
                    ) : (
                      leaveData.filter((l: any) => l.status === 'Pending').map((req: any) => (
                        <motion.div 
                          key={`pending-${req.id}`}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className={cn(
                            "border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden flex flex-col hover:shadow-xl transition-all cursor-pointer",
                            highlightedRequestId === req.id && "ring-2 ring-purple-500 animate-pulse border-purple-500"
                          )}
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsRequestDialogOpen(true);
                          }}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-stretch">
                            
                            {/* Employee Info Section */}
                            <div className="p-6 lg:p-8 flex-1 flex flex-col md:flex-row gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                              <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-900 shadow-md">
                                <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xl">{getInitials(req.employee)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h4 className="font-black text-xl text-slate-900 dark:text-white">{req.employee}</h4>
                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">{req.department}</Badge>
                                    {req.hrNotified && (
                                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                                        <Mail className="w-3 h-3 mr-1" /> HR Notified
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied on {req.appliedOn}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col gap-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Leave Details</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">{req.type}</Badge>
                                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                                        <CalendarDays className="h-4 w-4 mr-1.5 text-slate-400" />
                                        {req.days} Day{req.days > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{req.start} <span className="text-slate-400 mx-1">→</span> {req.end}</span>
                                  </div>
                                  
                                  <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4 flex flex-col gap-1 border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600/70 dark:text-amber-500/70">Reason</span>
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mt-1 leading-snug italic">
                                      "{req.reason}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions Section */}
                            <div className="p-6 lg:p-8 flex flex-col gap-3 justify-center w-full lg:w-[280px] bg-slate-50/50 dark:bg-slate-900/30">
                              <Button 
                                className="w-full rounded-xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(req.id);
                                }}
                                disabled={approvingId === req.id || rejectingId === req.id}
                              >
                                {approvingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> Approve Leave</>}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full rounded-xl h-12 font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-900/20 shadow-sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(req.id);
                                }}
                                disabled={approvingId === req.id || rejectingId === req.id}
                              >
                                {rejectingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><XCircle className="h-5 w-5 mr-2" /> Reject</>}
                              </Button>
                              <div className="relative mt-2">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-slate-50 dark:bg-[#0B1120] px-2 text-slate-500 font-bold">Or</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                className="w-full rounded-xl h-11 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 mt-2" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCommentModal(req.id);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Comment
                              </Button>
                            </div>

                          </div>
                            <div className="px-6 lg:px-8 pb-6 lg:pb-8">
                              <LeaveCommentHistory 
                                leaveId={req.id} 
                                comments={leaveComments} 
                                isManager={true} 
                                onEditComment={handleEditComment} 
                                onDeleteComment={handleDeleteComment} 
                              />
                            </div>
                        </motion.div>
                      ))
                    )}
                </AnimatePresence>
              </div>
            </TabsContent>
          )}

          {/* Manager: Processed History */}
          {isManager && (
            <TabsContent value="history">
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {leaveData.filter((l: any) => l.status !== 'Pending').length === 0 ? (
                        <motion.div key="empty-history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full text-center py-16 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                          <p className="text-slate-500 font-medium">No processed leaves found.</p>
                        </motion.div>
                      ) : (
                        leaveData.filter((l: any) => l.status !== 'Pending').map((req: any) => {
                          const lastComment = leaveComments.filter(c => c.leaveId === req.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                          return (
                            <motion.div
                              layout
                              key={`processed-${req.id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-[18px] p-5 flex flex-col justify-between max-h-[220px] shadow-md hover:shadow-lg transition-all"
                            >
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-black text-slate-900 dark:text-white text-base">{req.employee}</h4>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{req.type} • {req.start}</p>
                                  </div>
                                  <Badge className={req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}>
                                    {req.status === 'Approved' ? 'APPROVED ✅' : 'REJECTED ❌'}
                                  </Badge>
                                </div>
                                
                                {lastComment ? (
                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 line-clamp-2">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Manager Comment</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{lastComment.comment}"</p>
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Manager Comment</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No comments provided.</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                  <p className="text-[10px] text-slate-500 font-bold">{req.status} by Manager</p>
                                  <p className="text-[10px] text-slate-400">{req.appliedOn}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-blue-600 dark:text-blue-400" onClick={() => openCommentModal(req.id)}>
                                  {lastComment ? 'Edit Comment' : 'Add Comment'}
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                </AnimatePresence>
              </div>
            </TabsContent>
          )}
          
"""
    content = content.replace(old_manager_req_block, new_manager_req_block)


# 3. Add !isManager check to Employee's history
employee_history_start = content.find('{/* Employee: My History */}')
employee_history_end = content.find('{/* Employee: Leave Balance */}')

if employee_history_start != -1 and employee_history_end != -1:
    old_employee_block = content[employee_history_start:employee_history_end]
    new_employee_block = old_employee_block.replace('<TabsContent value="history">', '{!isManager && (<TabsContent value="history">').replace('</TabsContent>\n', '</TabsContent>\n          )}\n')
    content = content.replace(old_employee_block, new_employee_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
