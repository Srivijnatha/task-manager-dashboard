import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const isGeminiAvailable = !!process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (isGeminiAvailable) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Gemini AI Service initialized successfully.');
  } catch (error) {
    console.error('Error initializing Gemini AI Service:', error.message);
  }
} else {
  console.log('Gemini API key not found. Using local heuristic AI engine.');
}

/**
 * Recommend priority for a task based on its contents
 */
export const recommendPriority = async (title = '', description = '', dueDate = '', categoryName = '') => {
  const contentToAnalyze = `${title} ${description} ${categoryName}`.toLowerCase();
  
  if (isGeminiAvailable && model) {
    try {
      const prompt = `
        You are an expert productivity assistant. Analyze the task details below and suggest a priority level: "Low", "Medium", or "High".
        
        Task Title: "${title}"
        Task Description: "${description}"
        Due Date: "${dueDate || 'Not specified'}"
        Category: "${categoryName || 'General'}"
        
        Provide your response as a single word: either "Low", "Medium", or "High". Do not add any explanation or punctuation.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const recommendation = response.text().trim();
      
      if (['Low', 'Medium', 'High'].includes(recommendation)) {
        return recommendation;
      }
    } catch (error) {
      console.warn('Gemini API priority recommendation failed, falling back to heuristics:', error.message);
    }
  }

  // Local Heuristic Fallback
  let score = 0;
  
  // Keyword analysis
  const urgentKeywords = ['urgent', 'asap', 'critical', 'immediately', 'fail', 'emergency', 'blocker', 'deploy', 'boss', 'client', 'production', 'crash', 'audit'];
  const mediumKeywords = ['review', 'update', 'meeting', 'discussion', 'prepare', 'test', 'fix', 'refactor', 'plan', 'schedule', 'weekly'];
  
  urgentKeywords.forEach(word => {
    if (contentToAnalyze.includes(word)) score += 3;
  });
  
  mediumKeywords.forEach(word => {
    if (contentToAnalyze.includes(word)) score += 1;
  });

  // Due Date analysis
  if (dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      score += 1; // overdue
    } else if (diffDays <= 1) {
      score += 3; // due tomorrow/today
    } else if (diffDays <= 3) {
      score += 2; // due within 3 days
    }
  }

  // Category analysis
  if (categoryName.toLowerCase().includes('work') || categoryName.toLowerCase().includes('finance')) {
    score += 1;
  }

  if (score >= 4) return 'High';
  if (score >= 1) return 'Medium';
  return 'Low';
};

/**
 * Generate productivity insights based on user task stats and logs
 */
export const generateProductivityInsights = async (tasks = [], logs = []) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriority = tasks.filter(t => t.priority === 'High').length;
  const highCompleted = tasks.filter(t => t.priority === 'High' && t.status === 'completed').length;
  const highCompletionRate = highPriority > 0 ? Math.round((highCompleted / highPriority) * 100) : 0;

  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now).length;
  const overduePercentage = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

  if (isGeminiAvailable && model) {
    try {
      const prompt = `
        You are a smart performance and productivity coach. Analyze the user's task metrics below and generate 3 short, natural, and actionable insights to improve their workflow. Do not use generic advice.
        
        Metrics:
        - Total Tasks: ${totalTasks}
        - Completed: ${completedTasks} (${completionRate}% completion rate)
        - Pending: ${pendingTasks}
        - Overdue Tasks: ${overdueTasks} (${overduePercentage}% of total)
        - High Priority Tasks: ${highPriority} (${highCompleted} completed, ${highCompletionRate}% completion rate)
        - Recent Activities: ${logs.slice(0, 5).map(l => l.details).join(', ')}
        
        Format the response as a valid JSON array of strings containing exactly 3 items, for example:
        ["Insight 1 description here.", "Insight 2 description here.", "Insight 3 description here."]
        Ensure it contains only the JSON array block and no markdown formatting or extra text.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Clean markdown code blocks if the model returned them
      if (text.startsWith('```')) {
        text = text.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      
      const insights = JSON.parse(text);
      if (Array.isArray(insights) && insights.length === 3) {
        return insights;
      }
    } catch (error) {
      console.warn('Gemini API insights generation failed, falling back to heuristics:', error.message);
    }
  }

  // Local Heuristics Fallback
  const insights = [];
  
  // Suggestion 1: Completion & General Pace
  if (totalTasks === 0) {
    insights.push("Start your productivity journey by adding your first task and custom category.");
  } else if (completionRate < 30) {
    insights.push(`Your completion rate is currently at ${completionRate}%. Try focusing on finishing pending low-effort tasks to build positive momentum.`);
  } else if (completionRate > 80) {
    insights.push(`Outstanding! You have completed ${completionRate}% of your tasks. Maintain this rhythm and consider scheduling short breaks.`);
  } else {
    insights.push(`You have completed ${completedTasks} of your ${totalTasks} tasks. Keep going; tackling your mid-level priorities will make today highly successful.`);
  }

  // Suggestion 2: Overdue and Deadlines
  if (overdueTasks > 0) {
    insights.push(`You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Try breaking down their descriptions and pushing back due dates slightly to reduce cognitive load.`);
  } else if (pendingTasks > 0) {
    insights.push("Excellent work keeping your slate clean of overdue items! Your next upcoming deadline is safe.");
  } else {
    insights.push("No pending tasks. Spend this time planning your next project or organizing upcoming life goals.");
  }

  // Suggestion 3: Priorities management
  if (highPriority > 0 && highCompletionRate < 50) {
    insights.push(`High priority tasks have a ${highCompletionRate}% completion rate. Prioritize working on high impact items first thing in the morning.`);
  } else {
    insights.push("Your task prioritization looks balanced. Try categorizing tasks to group similar work together.");
  }

  return insights;
};

/**
 * Generate a dynamic dashboard summary text based on user tasks
 */
export const generateDashboardSummary = async (tasks = []) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now).length;
  
  if (isGeminiAvailable && model) {
    try {
      const prompt = `
        You are a friendly personal task planner. Write a short, natural, human-like summary (2-3 sentences) of the user's workload. Do not use AI clichés. Tell them how they are doing and what they should focus on.
        
        Metrics:
        - Total Tasks: ${totalTasks}
        - Pending: ${pendingTasks}
        - Completed: ${completedTasks}
        - Overdue: ${overdueTasks}
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.warn('Gemini API summary generation failed, falling back to heuristics:', error.message);
    }
  }

  // Local Heuristics Fallback
  if (totalTasks === 0) {
    return "Welcome to your new workspace. Create your first task to start organizing your schedule.";
  }
  
  if (overdueTasks > 0) {
    return `You currently have ${pendingTasks} pending task${pendingTasks > 1 ? 's' : ''}, with ${overdueTasks} being overdue. It would be highly beneficial to address these overdue items first to clear your backlog.`;
  }
  
  if (pendingTasks === 0) {
    return "You have cleared your schedule! All tasks are completed. Take a moment to celebrate, review, or plan what is next.";
  }
  
  return `You are doing well with ${completedTasks} of ${totalTasks} tasks completed. Focus on your remaining ${pendingTasks} pending tasks to finish the week strong.`;
};

/**
 * Generate interactive chat response for the AI Productivity Coach (Aria)
 */
export const generateChatResponse = async (message = '', history = [], tasks = []) => {
  const msgLower = message.toLowerCase().trim();
  
  if (isGeminiAvailable && model) {
    try {
      const tasksSummary = tasks.map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'None'})`).join('\n');
      
      const systemPrompt = `
You are Aria, a friendly and smart AI productivity coach helping the user manage their tasks and optimize their day.
The user is viewing their Productivity Dashboard. Here is the list of their current tasks for context:
${tasksSummary || 'No tasks created yet.'}

Guidelines:
1. Be encouraging, precise, and concise. Keep responses to 3-4 sentences maximum unless they ask for a detailed list.
2. If they ask about priorities, list the urgent or overdue tasks first.
3. Suggest practical time-management or productivity advice (like Pomodoro, micro-goals) when they seem stuck or ask for tips.
4. Respond in markdown but keep it visually clean. Do not output raw JSON.
`;

      const chatContext = history.slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Aria'}: ${h.content}`).join('\n');
      const finalPrompt = `${systemPrompt}\n\nChat History:\n${chatContext}\nUser: ${message}\nAria:`;

      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.warn('Gemini API chat response failed, falling back to heuristics:', error.message);
    }
  }

  // Local Smart Heuristic Fallback
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const high = activeTasks.filter(t => t.priority === 'High');
  const now = new Date();
  const overdue = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);

  if (msgLower.includes('plan') || msgLower.includes('day') || msgLower.includes('agenda') || msgLower.includes('today')) {
    if (activeTasks.length === 0) {
      return "Your slate is completely clear! 🌟 It's the perfect time to brainstorm new goals, learn something new, or take a refreshing break.";
    }
    
    let plan = `Here is a custom plan for you today:
1. **Focus First**: You have ${activeTasks.length} pending task(s). `;
    
    if (overdue.length > 0) {
      plan += `Tackle the overdue task **"${overdue[0].title}"** first to get it off your mind.\n`;
    } else if (high.length > 0) {
      plan += `Start with your high priority task **"${high[0].title}"** when your energy is highest.\n`;
    } else {
      plan += `Begin with **"${activeTasks[0].title}"** to establish a positive momentum.\n`;
    }
    
    plan += `2. **Intervals**: Use 25-minute Pomodoro focus blocks to maintain high concentration.
3. **Review**: Check off tasks as you go to log recent activity!`;
    
    return plan;
  }

  if (msgLower.includes('urgent') || msgLower.includes('priority') || msgLower.includes('focus') || msgLower.includes('overdue')) {
    if (overdue.length > 0) {
      return `⚠️ **Urgent Action Required**: You have **${overdue.length} overdue task(s)**. Focus on **"${overdue[0].title}"** immediately to get back on track.`;
    }
    if (high.length > 0) {
      return `🔥 **Top Priority**: Your main priority is **"${high[0].title}"** (High Priority). Concentrating your effort here will deliver the highest impact today.`;
    }
    if (activeTasks.length > 0) {
      return `Next up: You have no overdue or High priority items, but **"${activeTasks[0].title}"** is pending. Let's work on getting it done!`;
    }
    return "🎉 Good news! You have no urgent, overdue, or pending tasks right now. Enjoy the empty queue!";
  }

  if (msgLower.includes('tip') || msgLower.includes('procrastinat') || msgLower.includes('advice') || msgLower.includes('help')) {
    const tips = [
      "**The 5-Minute Rule**: Tell yourself you'll work on a task for just 5 minutes. Often, once you start, the friction disappears and you keep going.",
      "**Time Blocking**: Allocate specific slots on your calendar for distinct types of tasks, rather than working from a chaotic running list.",
      "**Micro-Goals**: Break your largest project into sub-tasks that take under 10 minutes. A small, clear victory builds positive energy.",
      "**Clean Environment**: Close unused browser tabs, turn off personal notifications, and focus on exactly *one* task at a time."
    ];
    return `💡 **Productivity Tip**: ${tips[Math.floor(Math.random() * tips.length)]}`;
  }

  if (msgLower.includes('status') || msgLower.includes('summary') || msgLower.includes('progress') || msgLower.includes('how am i')) {
    if (total === 0) {
      return "Welcome! You haven't created any tasks yet. Create a few tasks to get a real-time status summary.";
    }
    const rate = Math.round((completed / total) * 100);
    return `📈 **Current Workspace Status**:
- **Total Tasks Logged**: ${total}
- **Completed**: ${completed} (${rate}% completion rate)
- **Active Tasks**: ${activeTasks.length} (${high.length} high priority)
- **Overdue**: ${overdue.length}

You are making steady progress! Focus on your active items to improve your completion stats.`;
  }

  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey') || msgLower.includes('aria')) {
    return "Hi there! I'm **Aria**, your AI Productivity Coach. 🎯 I can help you plan your day, spot urgent tasks, analyze your workload, or give you advice to beat procrastination. What's on your mind?";
  }

  return "I'm Aria, your productivity assistant. I can help you plan your schedule, analyze your task list, suggest which task is most urgent, or give you tips on beating procrastination. Try asking: *'Plan my day'* or *'What is urgent?'*!";
};

