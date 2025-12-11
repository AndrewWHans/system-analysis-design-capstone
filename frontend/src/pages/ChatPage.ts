import { isLoggedIn, removeToken, isAdmin, authFetch, getPayload } from "../utils/auth";
import chatHtml from "./templates/ChatPage.html?raw";
import TomSelect from "tom-select";

interface Scenario {
    id: number;
    name: string;
    description: string;
}

interface Message {
    id: number;
    sender: 'BOT' | 'THERAPIST';
    content: string;
    timestamp: string;
}

interface Choice {
    id: number;
    text: string;
}

interface SessionState {
    id: number;
    scenarioID: number;
    scenario?: { name: string };
    messages: Message[];
    availableChoices: Choice[];
    isEndNode: boolean;
    startTime: string;
    endTime: string | null;
    finalDiagnosis?: { id: number; name: string } | null;
    isDiagnosisCorrect?: boolean | null;
}

interface ConditionOption {
    id: number;
    name: string;
}

export const renderChatPage = () => {
  return chatHtml;
};

export const setupChatPage = (navigate: (path: string) => void) => {
  // --- UI References ---
  const scenarioSelector = document.getElementById('scenario-selector')!;
  const chatInterface = document.getElementById('chat-interface')!;
  const scenarioList = document.getElementById('scenario-list')!;
  const messagesContainer = document.getElementById('messages-container')!;
  const choicesContainer = document.getElementById('choices-container')!;
  const sessionTitle = document.getElementById('session-title')!;
  const sessionSubtitle = document.getElementById('session-subtitle')!;
  const endSessionMsg = document.getElementById('end-session-msg')!;
  const historyList = document.getElementById('session-history-list')!;
  
  let currentSessionId: number | null = null;
  let availableConditions: ConditionOption[] = [];

  // --- Setup Navigation ---
  const adminNav = document.getElementById('nav-admin');
  if (adminNav && isAdmin()) {
    adminNav.classList.remove('hidden');
    adminNav.addEventListener('click', () => navigate('/admin'));
  }

  // Sidebar logic
  document.getElementById('nav-home')?.addEventListener('click', () => navigate('/'));
  document.getElementById('nav-logo')?.addEventListener('click', () => navigate('/'));
  document.getElementById('nav-new-chat')?.addEventListener('click', () => switchMode('selection'));
  document.getElementById('btn-restart')?.addEventListener('click', () => switchMode('selection'));

  // Header auth/profile logic
  const authContainer = document.getElementById("auth-buttons-container");
  if (authContainer && isLoggedIn()) {
    const user = getPayload();
    const username = user?.username || 'User';
    const initial = username[0].toUpperCase();

    // Render avatar + logout in a pill style
    authContainer.innerHTML = `
        <div class="flex items-center gap-3">
            <div id="btn-profile-header" class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 pr-3 pl-1 py-1 rounded-full transition group border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <div class="w-8 h-8 bg-gradient-to-tr from-[#5B3E86] to-[#9d7bd1] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:shadow-sm transition">
                    ${initial}
                </div>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden md:block">${username}</span>
            </div>
            <button id="btn-logout-nav" class="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition" title="Logout">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
        </div>
    `;
    
    document.getElementById('btn-profile-header')?.addEventListener('click', () => navigate('/profile'));
    document.getElementById('btn-logout-nav')?.addEventListener('click', () => {
        removeToken();
        navigate('/'); 
    });
  }

  document.getElementById('btn-view-profile')?.addEventListener('click', () => navigate('/profile'));

  // --- Helpers ---
  const formatDate = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const loadConditions = async () => {
      try {
          const res = await authFetch('http://localhost:3000/conditions');
          if(res.ok) availableConditions = await res.json();
      } catch(e) { console.error("Failed to load conditions", e); }
  };

  // --- Core Logic ---

  const switchMode = (mode: 'selection' | 'chat') => {
    if (mode === 'selection') {
        scenarioSelector.classList.remove('hidden');
        chatInterface.classList.add('hidden');
        sessionTitle.textContent = "Select a Scenario";
        sessionSubtitle.textContent = "Choose a patient to begin your diagnosis";
        sessionSubtitle.classList.remove('hidden');
        
        window.history.replaceState({}, "", "/chat");
        loadScenarios();
        loadHistory();
        currentSessionId = null;
    } else {
        scenarioSelector.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        sessionSubtitle.classList.add('hidden');
    }
  };

  const loadScenarios = async () => {
    try {
        const res = await authFetch('http://localhost:3000/scenarios');
        const scenarios: Scenario[] = await res.json();

        if (scenarios.length === 0) {
            scenarioList.innerHTML = `<div class="col-span-full text-center text-gray-500 bg-gray-50 dark:bg-gray-800 p-10 rounded-xl">No scenarios available. Ask an admin to create one.</div>`;
            return;
        }

        scenarioList.innerHTML = scenarios.map((s, index) => {
            // Cycle through some decorative gradients for cards
            const gradients = [
                'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-900',
                'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-900',
                'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-900',
            ];
            const theme = gradients[index % gradients.length];
            const iconColor = index % 3 === 0 ? 'text-blue-500' : (index % 3 === 1 ? 'text-purple-500' : 'text-emerald-500');

            return `
            <div class="relative group bg-white dark:bg-gray-900 p-6 rounded-2xl border ${theme} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden" data-id="${s.id}">
                <!-- Background Blob -->
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-current opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition ${iconColor}"></div>
                
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${iconColor} shadow-inner">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md uppercase tracking-wider">Case #${s.id}</span>
                </div>
                
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#5B3E86] transition">${s.name}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-6 leading-relaxed">${s.description || 'No description provided.'}</p>
                
                <div class="flex items-center text-[#5B3E86] dark:text-[#a78bfa] text-sm font-bold mt-auto">
                    Start Session 
                    <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
            </div>
        `}).join('');

        scenarioList.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => startSession(Number(el.getAttribute('data-id'))));
        });

    } catch (e) {
        scenarioList.innerHTML = `<div class="col-span-full text-center text-red-500">Failed to load scenarios.</div>`;
    }
  };

  const loadHistory = async () => {
      try {
          const res = await authFetch('http://localhost:3000/sessions');
          
          if (!res.ok) throw new Error(`Server error: ${res.status}`);

          const history = await res.json();
          if (!Array.isArray(history)) return;

          if (history.length === 0) {
              historyList.innerHTML = `<div class="text-xs text-gray-400 text-center py-4">No session history yet.</div>`;
              return;
          }

          historyList.innerHTML = history.map((s: SessionState) => {
            const isActive = s.id === currentSessionId;
            const activeClass = isActive 
                ? "bg-[#5B3E86]/10 border-[#5B3E86]" 
                : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800";
            
            return `
            <div class="history-item cursor-pointer p-3 rounded-xl border ${activeClass} transition group mb-2" data-id="${s.id}">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[70%] group-hover:text-[#5B3E86] transition">
                        ${s.scenario?.name || `Session #${s.id}`}
                    </span>
                    ${getStatusIcon(s)}
                </div>
                <div class="text-[10px] text-gray-400 font-medium">
                    ${formatDate(s.startTime)}
                </div>
            </div>
          `}).join('');

          historyList.querySelectorAll('.history-item').forEach(el => {
              el.addEventListener('click', () => {
                  const id = Number(el.getAttribute('data-id'));
                  currentSessionId = id;
                  switchMode('chat');
                  loadSession(id);
                  loadHistory();
              });
          });

      } catch (e) {
          historyList.innerHTML = `<div class="text-xs text-red-400 p-2">Failed to load history</div>`;
      }
  };

  const getStatusIcon = (s: SessionState) => {
      if(!s.endTime) return `<span class="w-2 h-2 rounded-full bg-yellow-400 shadow-sm animate-pulse" title="Active"></span>`;
      if(s.isDiagnosisCorrect === true) return `<svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`;
      if(s.isDiagnosisCorrect === false) return `<svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      return `<span class="w-2 h-2 rounded-full bg-gray-300" title="Ended"></span>`;
  };

  const startSession = async (scenarioId: number) => {
    try {
        const res = await authFetch('http://localhost:3000/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenarioId })
        });
        
        if (!res.ok) throw new Error('Failed to start session');
        
        const session: SessionState = await res.json();
        currentSessionId = session.id;
        
        switchMode('chat');
        renderSession(session);
        loadHistory();
    } catch (e) {
        alert("Error starting session");
    }
  };

  const submitChoice = async (choiceId: number) => {
    if (!currentSessionId) return;
    
    const btns = choicesContainer.querySelectorAll('button');
    btns.forEach(b => { b.disabled = true; b.classList.add('opacity-50'); });

    try {
        const res = await authFetch(`http://localhost:3000/sessions/${currentSessionId}/choice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choiceId })
        });

        if (!res.ok) throw new Error('Failed to submit choice');

        const updatedSession: SessionState = await res.json();
        renderSession(updatedSession);
        
        if(updatedSession.isEndNode) loadHistory();

    } catch (e) {
        alert("Error submitting choice");
        loadSession(currentSessionId);
    }
  };

  const submitDiagnosis = async (conditionId: number) => {
      if(!currentSessionId) return;
      const btn = document.getElementById('btn-submit-diag') as HTMLButtonElement;
      if(btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

      try {
          const res = await authFetch(`http://localhost:3000/sessions/${currentSessionId}/diagnosis`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conditionId })
          });

          if(!res.ok) throw new Error("Failed to submit");
          const result = await res.json();
          
          renderSession(result.session);
          loadHistory();

      } catch (e) {
          alert("Error submitting diagnosis");
          if(btn) { btn.disabled = false; btn.textContent = 'Submit Diagnosis'; }
      }
  };

  const loadSession = async (id: number) => {
      try {
          const res = await authFetch(`http://localhost:3000/sessions/${id}`);
          if(res.ok) renderSession(await res.json());
      } catch (e) { console.error(e); }
  };

  const renderSession = (session: SessionState) => {
    sessionTitle.innerHTML = session.scenario?.name || `Session #${session.id}`;
    
    messagesContainer.innerHTML = session.messages.map((msg, index) => {
        const isBot = msg.sender === 'BOT';
        const isLast = index === session.messages.length - 1;
        const animClass = isLast ? 'message-anim' : '';

        if (isBot) {
            return `
            <div class="flex w-full justify-start ${animClass}">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mr-4 shrink-0 shadow-sm border border-gray-100 dark:border-gray-700">
                     <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div class="max-w-[80%] md:max-w-[70%]">
                    <div class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700 text-md leading-relaxed">
                        ${msg.content}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 ml-1">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>`;
        } else {
            return `
            <div class="flex w-full justify-end ${animClass}">
                <div class="max-w-[80%] md:max-w-[70%] flex flex-col items-end">
                    <div class="bg-gradient-to-br from-[#5B3E86] to-[#7c5fb0] text-white p-5 rounded-2xl rounded-tr-none shadow-md shadow-purple-500/10 text-md leading-relaxed">
                        ${msg.content}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 mr-1">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-[#5B3E86] flex items-center justify-center ml-4 shrink-0 shadow-sm border border-white dark:border-gray-700">
                    <span class="text-xs font-bold text-white">ME</span>
                </div>
            </div>`;
        }
    }).join('');

    // Auto-scroll
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);

    // --- Controls Area ---
    choicesContainer.innerHTML = '';
    
    // Active chat (show choices)
    if (!session.endTime && !session.isEndNode) {
        choicesContainer.classList.remove('hidden');
        endSessionMsg.classList.add('hidden');

        if (session.availableChoices && session.availableChoices.length > 0) {
            session.availableChoices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = "flex-grow min-w-[200px] text-center px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#5B3E86] hover:text-white hover:border-[#5B3E86] dark:hover:bg-[#5B3E86] dark:hover:border-[#5B3E86] dark:text-gray-200 transition-all shadow-sm hover:shadow-md font-medium text-sm md:text-base animate-fade-in-up";
                btn.innerHTML = choice.text;
                btn.onclick = () => submitChoice(choice.id);
                choicesContainer.appendChild(btn);
            });
        } else {
            choicesContainer.innerHTML = '<div class="w-full text-center text-gray-400 italic">No further options available.</div>';
        }
        return;
    }

    // Session ended, check diagnosis status
    choicesContainer.classList.add('hidden');
    endSessionMsg.classList.remove('hidden');

    const diagSection = endSessionMsg;
    
    if (session.finalDiagnosis) {
        // Diagnosis submitted: show result
        const isCorrect = session.isDiagnosisCorrect;

        const containerClasses = isCorrect 
            ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50' 
            : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50';
            
        const icon = isCorrect 
            ? `<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>`
            : `<div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></div>`;
        
        diagSection.innerHTML = `
            <div class="max-w-lg mx-auto p-8 rounded-2xl border ${containerClasses} mb-6 shadow-sm">
                ${icon}
                <h3 class="text-2xl font-bold mb-2 ${isCorrect ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}">
                    ${isCorrect ? 'Correct Diagnosis!' : 'Incorrect Diagnosis'}
                </h3>
                <p class="text-gray-600 dark:text-gray-300 mb-1 text-lg">You selected: <strong class="font-semibold">${session.finalDiagnosis.name}</strong></p>
                <p class="text-sm ${isCorrect ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}">
                    ${isCorrect ? 'Excellent clinical reasoning.' : 'Review the patient history and try similar cases.'}
                </p>
            </div>
            <button id="btn-restart-final" class="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:opacity-80 transition shadow-lg transform hover:-translate-y-0.5">Return to Menu</button>
        `;
        document.getElementById('btn-restart-final')?.addEventListener('click', () => switchMode('selection'));

    } else {
        // Needs diagnosis
        const optionsHtml = availableConditions.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        diagSection.innerHTML = `
            <div class="max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
                <div class="w-12 h-12 bg-[#5B3E86]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6 text-[#5B3E86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                </div>
                <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Session Concluded</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">Review the conversation and submit your clinical diagnosis.</p>
                
                <div class="mb-6 text-left">
                    <label class="block text-xs font-bold uppercase text-gray-500 mb-2">Select Condition</label>
                    <select id="diagnosis-select" class="w-full" placeholder="Search conditions...">
                        <option value="">Select a condition...</option>
                        ${optionsHtml}
                    </select>
                </div>
                <button id="btn-submit-diag" class="w-full bg-[#5B3E86] text-white py-3.5 rounded-xl font-bold hover:bg-[#4a326c] transition shadow-lg hover:shadow-xl transform active:scale-95">Submit Diagnosis</button>
            </div>
        `;

        // Initialize TomSelect for searchable dropdown with nicer styling
        new TomSelect('#diagnosis-select', {
            create: false,
            maxItems: 1,
            sortField: [{ field: "text", direction: "asc" }]
        });

        document.getElementById('btn-submit-diag')?.addEventListener('click', () => {
            const select = document.getElementById('diagnosis-select') as HTMLSelectElement;
            if(select.value) submitDiagnosis(Number(select.value));
            else alert("Please select a diagnosis.");
        });
    }
  };

  // Initial load
  loadScenarios();
  loadHistory();
  loadConditions();

  // Check for deep link via query parameters (e.g. ?sessionId=5)
  const params = new URLSearchParams(window.location.search);
  const deepLinkSessionId = params.get('sessionId');
  if (deepLinkSessionId) {
      const id = Number(deepLinkSessionId);
      if(!isNaN(id)) {
          currentSessionId = id;
          switchMode('chat');
          loadSession(id);
      }
  }
};