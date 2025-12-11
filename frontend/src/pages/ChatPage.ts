import { isLoggedIn, removeToken, isAdmin, authFetch } from "../utils/auth";
import chatHtml from "./templates/ChatPage.html?raw";

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

  document.getElementById('nav-home')?.addEventListener('click', () => navigate('/'));
  document.getElementById('nav-new-chat')?.addEventListener('click', () => switchMode('selection'));
  document.getElementById('btn-restart')?.addEventListener('click', () => switchMode('selection'));

  const authContainer = document.getElementById("auth-buttons-container");
  if (authContainer && isLoggedIn()) {
    authContainer.innerHTML = `<button id="btn-logout-nav" class="text-sm text-red-500 hover:text-red-700 font-medium">Logout</button>`;
    document.getElementById('btn-logout-nav')?.addEventListener('click', () => {
        removeToken();
        navigate('/'); 
    });
  }

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
          
          // Re-render session with new state (should show result now)
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
    
    // 1. Render Messages
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

    // 2. Render Choices or Diagnosis Screen
    choicesContainer.innerHTML = '';
    
    // Case 1: Active Chat (Show Choices)
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

    // Case 2: Session Ended, Check Diagnosis status
    choicesContainer.classList.add('hidden');
    endSessionMsg.classList.remove('hidden');

    const diagSection = endSessionMsg;
    
    if (session.finalDiagnosis) {
        // Diagnosis Submitted: Show Result
        const isCorrect = session.isDiagnosisCorrect;
        const color = isCorrect ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
        
        diagSection.innerHTML = `
            <div class="max-w-md mx-auto p-6 rounded-lg border ${color} mb-6">
                <h3 class="text-xl font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}">
                    ${isCorrect ? 'Correct Diagnosis' : 'Incorrect Diagnosis'}
                </h3>
                <p class="text-gray-700 dark:text-gray-300 mb-1">You diagnosed: <strong>${session.finalDiagnosis.condition?.name}</strong></p>
                <p class="text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}">
                    ${isCorrect ? 'Great job! You identified the condition correctly.' : 'Review the symptoms and try again.'}
                </p>
            </div>
            <button id="btn-restart-final" class="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-medium hover:opacity-90 transition shadow-md">Return to Menu</button>
        `;
        document.getElementById('btn-restart-final')?.addEventListener('click', () => switchMode('selection'));

    } else {
        // Needs Diagnosis
        const optionsHtml = availableDiagnoses.map(d => `<option value="${d.id}">${d.condition.name}</option>`).join('');
        
        diagSection.innerHTML = `
            <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Session Concluded. What is client's diagnosis?</h3>
                <div class="mb-4">
                    <select id="diagnosis-select" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86]">
                        <option value="" disabled selected>Select a condition...</option>
                        ${optionsHtml}
                    </select>
                </div>
                <button id="btn-submit-diag" class="w-full bg-[#5B3E86] text-white py-3 rounded-lg font-medium hover:bg-[#4a326c] transition">Submit Diagnosis</button>
            </div>
        `;

        document.getElementById('btn-submit-diag')?.addEventListener('click', () => {
            const select = document.getElementById('diagnosis-select') as HTMLSelectElement;
            if(select.value) submitDiagnosis(Number(select.value));
            else alert("Please select a diagnosis.");
        });
    }
  };

  // Initial Load
  loadScenarios();
  loadHistory();
  loadDiagnoses();
};