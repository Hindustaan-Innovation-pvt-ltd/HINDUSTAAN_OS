import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Paperclip, 
  Send, 
  X, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// --- Types & Schema ---
const whatsappSchema = z.object({
  recipient: z.string().min(1, 'Please select a recipient'),
  message: z.string().min(1, 'Message cannot be empty'),
});

const RECIPIENTS = [
  { id: 'all', name: 'All Interns (Broadcast)', type: 'group' },
  { id: '1', name: 'Amanda Smith', type: 'individual' },
  { id: '2', name: 'Rahul Sharma', type: 'individual' },
  { id: '3', name: 'Priya Patel', type: 'individual' },
  { id: '4', name: 'Rohan Gupta', type: 'individual' },
  { id: '5', name: 'Aiden Chen', type: 'individual' },
];

export function WhatsAppBroadcastDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const form = useForm<z.infer<typeof whatsappSchema>>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      recipient: '',
      message: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (values: z.infer<typeof whatsappSchema>) => {
    setLoading(true);
    
    // Simulate API call to WhatsApp Business API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    toast.success('Message sent via WhatsApp.', {
      description: `Successfully delivered to ${RECIPIENTS.find(r => r.id === values.recipient)?.name}.`
    });
    
    form.reset();
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 shadow-2xl">
        
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-emerald-50/50 dark:bg-emerald-900/10">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            {/* Minimalist WhatsApp SVG Icon */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 mr-2 text-emerald-500 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Send to WhatsApp
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Broadcast messages or share documents directly to interns' WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <div className="p-6 space-y-5">
              
              {/* Recipient */}
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700 dark:text-slate-300">To <span className="text-emerald-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500">
                          <SelectValue placeholder="Select contact or group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
                        {RECIPIENTS.map(recipient => (
                          <SelectItem key={recipient.id} value={recipient.id} className="font-medium">
                            {recipient.type === 'group' ? '📢 ' : '👤 '}{recipient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Message <span className="text-emerald-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here..." 
                        className="resize-none h-32 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-emerald-500" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload (Frontend Only) */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Attachment (Optional)</span>
                
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    />
                    <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Click or drag file to attach</span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1">Supports PDF, JPG, PNG, DOCX (Max 16MB)</span>
                  </div>
                ) : (
                  <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                        {selectedFile.type.includes('image') ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</span>
                        <span className="text-xs font-semibold text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

            </div>

            <DialogFooter className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between sm:justify-between items-center">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-lg bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold px-6 transition-colors shadow-lg shadow-[#25D366]/20">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send to WhatsApp
              </Button>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}
