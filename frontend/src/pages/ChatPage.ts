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
    finalDiagnosis?: { id: number; condition: { name: string } } | null;
    isDiagnosisCorrect?: boolean | null;
}

interface DiagnosisOption {
    id: number;
    condition: { name: string };
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
  const endSessionMsg = document.getElementById('end-session-msg')!;
  const historyList = document.getElementById('session-history-list')!;
  
  let currentSessionId: number | null = null;
  let availableDiagnoses: DiagnosisOption[] = [];

  // --- Setup Navigation ---
  const adminNav = document.getElementById('nav-admin');
  if (adminNav && isAdmin()) {
    adminNav.classList.remove('hidden');
    adminNav.addEventListener('click', () => navigate('/admin'));
  }

  // Sidebar logic
  document.getElementById('nav-home')?.addEventListener('click', () => navigate('/'));
  document.getElementById('nav-logo')?.addEventListener('click', () => navigate('/')); // Added logo click
  document.getElementById('nav-new-chat')?.addEventListener('click', () => switchMode('selection'));
  document.getElementById('btn-restart')?.addEventListener('click', () => switchMode('selection'));

  // Header auth/profile logic
  const authContainer = document.getElementById("auth-buttons-container");
  if (authContainer && isLoggedIn()) {
    const user = getPayload();
    const username = user?.username || 'User';
    const initial = username[0].toUpperCase();

    // Render avatar + logout
    authContainer.innerHTML = `
        <div class="flex items-center gap-3">
            <div id="btn-profile-header" class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition group">
                <div class="w-8 h-8 bg-[#5B3E86] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:shadow-md transition">
                    ${initial}
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block group-hover:text-[#5B3E86] transition">${username}</span>
            </div>
            <div class="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button id="btn-logout-nav" class="text-sm text-red-500 hover:text-red-700 cursor-pointer font-medium">Logout</button>
        </div>
    `;
    
    document.getElementById('btn-profile-header')?.addEventListener('click', () => navigate('/profile'));
    document.getElementById('btn-logout-nav')?.addEventListener('click', () => {
        removeToken();
        navigate('/'); 
    });
  }

  // New profile link listener (Sidebar)
  document.getElementById('btn-view-profile')?.addEventListener('click', () => navigate('/profile'));


  // --- Helpers ---
  const formatDate = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const loadDiagnoses = async () => {
      try {
          const res = await authFetch('http://localhost:3000/diagnoses');
          if(res.ok) availableDiagnoses = await res.json();
      } catch(e) { console.error("Failed to load diagnoses", e); }
  };

  // --- Core Logic ---

  const switchMode = (mode: 'selection' | 'chat') => {
    if (mode === 'selection') {
        scenarioSelector.classList.remove('hidden');
        chatInterface.classList.add('hidden');
        sessionTitle.textContent = "Select a Scenario";
        // Clear param from URL if switching back to selection manually
        window.history.replaceState({}, "", "/chat");
        loadScenarios();
        loadHistory();
        currentSessionId = null;
    } else {
        scenarioSelector.classList.add('hidden');
        chatInterface.classList.remove('hidden');
    }
  };

  const loadScenarios = async () => {
    scenarioList.innerHTML = `<div class="col-span-full text-center text-gray-500 animate-pulse">Loading scenarios...</div>`;
    try {
        const res = await authFetch('http://localhost:3000/scenarios');
        const scenarios: Scenario[] = await res.json();

        if (scenarios.length === 0) {
            scenarioList.innerHTML = `<div class="col-span-full text-center text-gray-500">No scenarios available. Ask an admin to create one.</div>`;
            return;
        }

        scenarioList.innerHTML = scenarios.map(s => `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#5B3E86] transition cursor-pointer group" data-id="${s.id}">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#5B3E86] transition">${s.name}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm line-clamp-3">${s.description || 'No description provided.'}</p>
                <div class="mt-4 flex items-center text-[#5B3E86] dark:text-[#a78bfa] text-sm font-medium">
                    Start Session 
                    <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
            </div>
        `).join('');

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
              historyList.innerHTML = `<div class="text-xs text-gray-500 italic p-2">No previous sessions.</div>`;
              return;
          }

          historyList.innerHTML = history.map((s: SessionState) => `
            <div class="history-item cursor-pointer p-3 rounded-lg border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition group mb-1" data-id="${s.id}">
                <div class="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#5B3E86] truncate">
                    ${s.scenario?.name || `Session #${s.id}`}
                </div>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-[10px] uppercase tracking-wide text-gray-400">${formatDate(s.startTime)}</span>
                    ${getStatusBadge(s)}
                </div>
            </div>
          `).join('');

          historyList.querySelectorAll('.history-item').forEach(el => {
              el.addEventListener('click', () => {
                  const id = Number(el.getAttribute('data-id'));
                  currentSessionId = id;
                  switchMode('chat');
                  loadSession(id);
              });
          });

      } catch (e) {
          historyList.innerHTML = `<div class="text-xs text-red-400 p-2">Failed to load history</div>`;
      }
  };

  const getStatusBadge = (s: SessionState) => {
      if(!s.endTime) return `<span class="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-medium">Active</span>`;
      
      if(s.isDiagnosisCorrect === true) return `<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">Correct</span>`;
      if(s.isDiagnosisCorrect === false) return `<span class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-medium">Incorrect</span>`;
      
      return `<span class="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-md font-medium">Pending Diagnosis</span>`;
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
    choicesContainer.innerHTML = '<div class="text-center text-gray-400 text-sm py-4">Thinking...</div>';

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

  const submitDiagnosis = async (diagnosisId: number) => {
      if(!currentSessionId) return;
      const btn = document.getElementById('btn-submit-diag') as HTMLButtonElement;
      if(btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

      try {
          const res = await authFetch(`http://localhost:3000/sessions/${currentSessionId}/diagnosis`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ diagnosisId })
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
    sessionTitle.innerHTML = `
        <span class="text-gray-500 dark:text-gray-400 font-normal mr-2">Session #${session.id}</span>
        <span class="font-bold">${session.scenario?.name || ''}</span>
    `;
    
    // Render messages
    messagesContainer.innerHTML = session.messages.map(msg => {
        const isBot = msg.sender === 'BOT';
        const alignClass = isBot ? 'justify-start' : 'justify-end';
        const bgClass = isBot 
            ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700' 
            : 'bg-[#5B3E86] text-white rounded-tr-none';
        
        const icon = isBot 
            ? `<div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 shrink-0"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>`
            : ``;

        return `
            <div class="flex w-full ${alignClass} animate-fade-in-up">
                ${isBot ? icon : ''}
                <div class="${bgClass} p-4 rounded-xl shadow-sm max-w-[80%] md:max-w-[70%] text-sm md:text-base leading-relaxed">
                    ${msg.content}
                </div>
            </div>
        `;
    }).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Render choices or diagnosis screen
    choicesContainer.innerHTML = '';
    
    // Active chat (show choices)
    if (!session.endTime && !session.isEndNode) {
        choicesContainer.classList.remove('hidden');
        endSessionMsg.classList.add('hidden');

        if (session.availableChoices && session.availableChoices.length > 0) {
            session.availableChoices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = "text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#5B3E86] hover:bg-[#5B3E86] hover:text-white dark:hover:border-[#5B3E86] bg-white dark:bg-gray-800 dark:text-gray-200 transition shadow-sm hover:shadow-md group";
                btn.innerHTML = `<span class="font-medium">${choice.text}</span>`;
                btn.onclick = () => submitChoice(choice.id);
                choicesContainer.appendChild(btn);
            });
        } else {
            choicesContainer.innerHTML = '<div class="col-span-full text-center text-gray-400">No choices available.</div>';
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
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
            
        const titleClass = isCorrect 
            ? 'text-green-700 dark:text-green-400' 
            : 'text-red-700 dark:text-red-400';
            
        const textClass = isCorrect 
            ? 'text-green-600 dark:text-green-300' 
            : 'text-red-600 dark:text-red-300';
        
        diagSection.innerHTML = `
            <div class="max-w-md mx-auto p-6 rounded-lg border ${containerClasses} mb-6">
                <h3 class="text-xl font-bold mb-2 ${titleClass}">
                    ${isCorrect ? 'Correct Diagnosis' : 'Incorrect Diagnosis'}
                </h3>
                <p class="text-gray-700 dark:text-gray-300 mb-1">You diagnosed: <strong>${session.finalDiagnosis.condition?.name}</strong></p>
                <p class="text-sm ${textClass}">
                    ${isCorrect ? 'Great job! You identified the condition correctly.' : 'Review the symptoms and try again.'}
                </p>
            </div>
            <button id="btn-restart-final" class="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-medium hover:opacity-90 transition shadow-md">Return to Menu</button>
        `;
        document.getElementById('btn-restart-final')?.addEventListener('click', () => switchMode('selection'));

    } else {
        // Needs diagnosis
        const optionsHtml = availableDiagnoses.map(d => `<option value="${d.id}">${d.condition.name}</option>`).join('');
        
        diagSection.innerHTML = `
            <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Session Concluded. What is your diagnosis?</h3>
                <div class="mb-4">
                    <select id="diagnosis-select" class="w-full" placeholder="Select a condition...">
                        <option value="">Select a condition...</option>
                        ${optionsHtml}
                    </select>
                </div>
                <button id="btn-submit-diag" class="w-full bg-[#5B3E86] text-white py-3 rounded-lg font-medium hover:bg-[#4a326c] transition">Submit Diagnosis</button>
            </div>
        `;

        // Initialize TomSelect for searchable dropdown
        new TomSelect('#diagnosis-select', {
            create: false,
            maxItems: 1,
            sortField: [{
                field: "text",
                direction: "asc"
            }]
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
  loadDiagnoses();

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